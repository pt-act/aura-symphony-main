"""
Aura Vector Search Service

A ChromaDB-backed semantic search service for video content indexing.
Supports ingestion of transcript chunks and frame descriptions,
and returns ranked results by cosine similarity.

Endpoints:
  POST /ingest     — Ingest video chunks for indexing
  GET  /search     — Semantic search across indexed content
  GET  /health     — Service health check
  GET  /stats      — Collection statistics
"""

import os
import time
from typing import Optional
from contextlib import asynccontextmanager

import chromadb
from chromadb.config import Settings as ChromaSettings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ─── Configuration ─────────────────────────────────────────────────

PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_data")
COLLECTION_NAME = "video_chunks"
MIN_SIMILARITY = float(os.environ.get("MIN_SIMILARITY", "0.3"))
MAX_RESULTS = int(os.environ.get("MAX_RESULTS", "10"))

# ─── ChromaDB Setup ───────────────────────────────────────────────

chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"},
)

# ─── Models ────────────────────────────────────────────────────────

class VideoChunk(BaseModel):
    id: str
    videoId: str
    content: str
    timestamp: float
    endTime: float
    type: str = Field(default="transcript")
    metadata: Optional[dict] = None

class IngestRequest(BaseModel):
    chunks: list[VideoChunk]

class IngestResponse(BaseModel):
    ingested: int
    errors: int

class SearchResult(BaseModel):
    chunk: VideoChunk
    similarity: float

class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    searchTimeMs: float
    source: str = "vector"

class HealthResponse(BaseModel):
    status: str
    collection: str
    count: int

class StatsResponse(BaseModel):
    total_chunks: int
    videos: list[str]
    types: dict[str, int]

# ─── App ───────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[Vector Search] Starting with persist dir: {PERSIST_DIR}")
    count = collection.count()
    print(f"[Vector Search] Collection '{COLLECTION_NAME}' has {count} chunks")
    yield
    print("[Vector Search] Shutting down")

app = FastAPI(title="Aura Vector Search", lifespan=lifespan)

# ─── Endpoints ─────────────────────────────────────────────────────

@app.post("/ingest", response_model=IngestResponse)
async def ingest_chunks(request: IngestRequest):
    """Ingest video chunks into the vector store."""
    ingested = 0
    errors = 0

    ids = []
    documents = []
    metadatas = []

    for chunk in request.chunks:
        try:
            ids.append(chunk.id)
            documents.append(chunk.content)
            metadatas.append({
                "videoId": chunk.videoId,
                "timestamp": chunk.timestamp,
                "endTime": chunk.endTime,
                "type": chunk.type,
                **(chunk.metadata or {}),
            })
        except Exception as e:
            print(f"[Ingest] Error processing chunk {chunk.id}: {e}")
            errors += 1

    if ids:
        try:
            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            ingested = len(ids)
        except Exception as e:
            print(f"[Ingest] Batch upsert error: {e}")
            errors += len(ids)

    return IngestResponse(ingested=ingested, errors=errors)


@app.get("/search", response_model=SearchResponse)
async def search(
    query: str,
    videoId: Optional[str] = None,
    minSimilarity: float = MIN_SIMILARITY,
    maxResults: int = MAX_RESULTS,
):
    """Semantic search across indexed video content."""
    start = time.time()

    # Build where filter
    where = None
    if videoId:
        where = {"videoId": videoId}

    try:
        results = collection.query(
            query_texts=[query],
            n_results=maxResults,
            where=where,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    search_results = []
    if results["ids"] and results["ids"][0]:
        for i, doc_id in enumerate(results["ids"][0]):
            # Chroma returns distances; cosine distance = 1 - similarity
            distance = results["distances"][0][i] if results["distances"] else 1.0
            similarity = 1.0 - distance

            if similarity < minSimilarity:
                continue

            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            doc = results["documents"][0][i] if results["documents"] else ""

            chunk = VideoChunk(
                id=doc_id,
                videoId=meta.get("videoId", ""),
                content=doc,
                timestamp=meta.get("timestamp", 0),
                endTime=meta.get("endTime", 0),
                type=meta.get("type", "transcript"),
            )

            search_results.append(SearchResult(chunk=chunk, similarity=similarity))

    elapsed_ms = (time.time() - start) * 1000

    return SearchResponse(
        query=query,
        results=search_results,
        searchTimeMs=elapsed_ms,
        source="vector",
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    try:
        count = collection.count()
        return HealthResponse(status="ok", collection=COLLECTION_NAME, count=count)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Unhealthy: {e}")


@app.get("/stats", response_model=StatsResponse)
async def stats():
    """Collection statistics."""
    count = collection.count()

    # Get a sample to extract video IDs and types
    sample = collection.get(limit=min(count, 1000))
    videos = set()
    types: dict[str, int] = {}

    if sample["metadatas"]:
        for meta in sample["metadatas"]:
            videos.add(meta.get("videoId", ""))
            t = meta.get("type", "unknown")
            types[t] = types.get(t, 0) + 1

    return StatsResponse(
        total_chunks=count,
        videos=sorted(videos),
        types=types,
    )


@app.delete("/clear")
async def clear_collection():
    """Clear all indexed data (development only)."""
    global collection
    chroma_client.delete_collection(COLLECTION_NAME)
    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return {"status": "cleared"}
