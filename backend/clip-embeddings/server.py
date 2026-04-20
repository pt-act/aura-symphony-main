"""
CLIP Embedding Service for Multimodal RAG

A FastAPI backend that provides CLIP (ViT-B/32) embeddings for both
images and text. Enables cross-modal search: text queries can match
against visual frame content without re-running the LLM.

Endpoints:
  POST /embed/images  — Embed multiple images → vectors
  POST /embed/text    — Embed text query → vector
  POST /embed/image   — Embed single image → vector
  POST /search/visual — Search stored frame embeddings
  POST /ingest        — Store frame embeddings for later search
  GET  /health        — Service health check
  GET  /stats         — Embedding store statistics

Requirements:
  torch, transformers, Pillow, fastapi, uvicorn, chromadb
"""

import os
import io
import time
import base64
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Configuration ─────────────────────────────────────────────────

MODEL_NAME = os.environ.get("CLIP_MODEL", "openai/clip-vit-base-patch32")
PERSIST_DIR = os.environ.get("CLIP_PERSIST_DIR", "./clip_data")
COLLECTION_NAME = "frame_embeddings"
PORT = int(os.environ.get("PORT", "3006"))

# ─── Lazy model loading (avoid import-time GPU allocation) ─────────

_model = None
_processor = None
_tokenizer = None

def get_model():
    """Lazily loads the CLIP model and processor."""
    global _model, _processor, _tokenizer
    if _model is None:
        try:
            import torch
            from transformers import CLIPModel, CLIPProcessor

            print(f"[CLIP] Loading model: {MODEL_NAME}")
            _model = CLIPModel.from_pretrained(MODEL_NAME)
            _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
            _model.eval()
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _model = _model.to(device)
            print(f"[CLIP] Model loaded on {device}")
        except ImportError as e:
            raise RuntimeError(
                f"Missing dependency: {e}. Install with: "
                "pip install torch transformers Pillow"
            )
    return _model, _processor

# ─── ChromaDB for embedding storage ───────────────────────────────

import chromadb
from chromadb.config import Settings as ChromaSettings

chroma_client = chromadb.PersistentClient(path=PERSIST_DIR)
frame_collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"},
)

# ─── Models ────────────────────────────────────────────────────────

class EmbedImagesRequest(BaseModel):
    images: list[str] = Field(description="Base64-encoded images")
    videoId: str
    timestamps: list[float]
    model: str = "ViT-B/32"

class EmbedTextRequest(BaseModel):
    text: str
    model: str = "ViT-B/32"

class EmbedImageRequest(BaseModel):
    image: str = Field(description="Base64-encoded image")
    model: str = "ViT-B/32"

class VisualSearchRequest(BaseModel):
    embedding: list[float]
    videoId: Optional[str] = None
    maxResults: int = 10

class IngestRequest(BaseModel):
    frameId: str
    videoId: str
    timestamp: float
    embedding: list[float]
    description: Optional[str] = None

# ─── App ───────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[CLIP] Starting CLIP embedding service on port {PORT}")
    count = frame_collection.count()
    print(f"[CLIP] Frame collection has {count} embeddings")
    yield
    print("[CLIP] Shutting down")

app = FastAPI(title="Aura CLIP Embedding Service", lifespan=lifespan)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=86400,
)

# ─── Embedding helpers ─────────────────────────────────────────────

def decode_base64_image(b64: str):
    """Decode a base64 image string to PIL Image."""
    from PIL import Image

    # Remove data URI prefix if present
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    image_bytes = base64.b64decode(b64)
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def embed_images_batch(images_b64: list[str]) -> list[list[float]]:
    """Embed a batch of base64 images, returning vectors."""
    import torch
    from PIL import Image

    model, processor = get_model()
    pil_images = [decode_base64_image(b64) for b64 in images_b64]

    inputs = processor(images=pil_images, return_tensors="pt", padding=True)
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

    return image_features.cpu().tolist()


def embed_text_single(text: str) -> list[float]:
    """Embed a single text query, returning a vector."""
    import torch

    model, processor = get_model()

    inputs = processor(text=[text], return_tensors="pt", padding=True, truncation=True)
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    return text_features.cpu().tolist()[0]

# ─── Endpoints ─────────────────────────────────────────────────────

@app.post("/embed/images")
async def embed_images(request: EmbedImagesRequest):
    """Embed multiple images and optionally store in the vector DB."""
    start = time.time()
    try:
        vectors = embed_images_batch(request.images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # Store in ChromaDB
    ids = [f"{request.videoId}-frame-{i}" for i in range(len(vectors))]
    metadatas = [
        {"videoId": request.videoId, "timestamp": ts}
        for ts in request.timestamps
    ]

    try:
        frame_collection.upsert(
            ids=ids,
            embeddings=vectors,
            metadatas=metadatas,
            documents=[f"Frame at {ts:.1f}s" for ts in request.timestamps],
        )
    except Exception as e:
        print(f"[CLIP] Storage error: {e}")

    elapsed = (time.time() - start) * 1000
    return {
        "embeddings": [
            {
                "frameId": ids[i],
                "videoId": request.videoId,
                "timestamp": request.timestamps[i],
                "embedding": vectors[i],
            }
            for i in range(len(vectors))
        ],
        "count": len(vectors),
        "timeMs": elapsed,
    }


@app.post("/embed/text")
async def embed_text_endpoint(request: EmbedTextRequest):
    """Embed a text query for cross-modal search."""
    try:
        vector = embed_text_single(request.text)
        return {"embedding": vector, "dimensions": len(vector)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text embedding failed: {e}")


@app.post("/embed/image")
async def embed_single_image(request: EmbedImageRequest):
    """Embed a single image for image→image search."""
    try:
        vectors = embed_images_batch([request.image])
        return {"embedding": vectors[0], "dimensions": len(vectors[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image embedding failed: {e}")


@app.post("/search/visual")
async def visual_search(request: VisualSearchRequest):
    """Search stored frame embeddings by similarity."""
    start = time.time()

    where = None
    if request.videoId:
        where = {"videoId": request.videoId}

    try:
        results = frame_collection.query(
            query_embeddings=[request.embedding],
            n_results=request.maxResults,
            where=where,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    search_results = []
    if results["ids"] and results["ids"][0]:
        for i, frame_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i] if results["distances"] else 1.0
            similarity = 1.0 - distance
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            doc = results["documents"][0][i] if results["documents"] else ""

            search_results.append({
                "frameId": frame_id,
                "videoId": meta.get("videoId", ""),
                "timestamp": meta.get("timestamp", 0),
                "similarity": similarity,
                "description": doc,
            })

    elapsed = (time.time() - start) * 1000
    return {"results": search_results, "searchTimeMs": elapsed}


@app.get("/health")
async def health():
    """Health check."""
    count = frame_collection.count()
    return {"status": "ok", "collection": COLLECTION_NAME, "count": count}


@app.get("/stats")
async def stats():
    """Collection statistics."""
    count = frame_collection.count()
    sample = frame_collection.get(limit=min(count, 500))
    videos = set()
    if sample["metadatas"]:
        for meta in sample["metadatas"]:
            videos.add(meta.get("videoId", ""))
    return {"total_frames": count, "videos": sorted(videos)}