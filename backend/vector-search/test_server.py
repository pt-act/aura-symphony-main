"""
Tests for the Aura Vector Search Service.

Uses FastAPI TestClient with an in-memory ChromaDB instance.
No network calls — pure unit tests for the API layer.
"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

# Use a temp directory for ChromaDB so tests don't pollute real data
os.environ["CHROMA_PERSIST_DIR"] = tempfile.mkdtemp()

from server import app

client = TestClient(app)

# ─── Fixtures ──────────────────────────────────────────────────────

SAMPLE_CHUNKS = [
    {
        "id": "vid-1-chunk-0",
        "videoId": "vid-1",
        "content": "The black hole at the center of our galaxy was photographed by the Event Horizon Telescope",
        "timestamp": 0,
        "endTime": 10,
        "type": "transcript",
    },
    {
        "id": "vid-1-chunk-1",
        "videoId": "vid-1",
        "content": "Quantum entanglement allows particles to be correlated across vast distances",
        "timestamp": 30,
        "endTime": 40,
        "type": "transcript",
    },
    {
        "id": "vid-2-chunk-0",
        "videoId": "vid-2",
        "content": "The speed of light is approximately 299792 kilometers per second",
        "timestamp": 0,
        "endTime": 5,
        "type": "frame_description",
    },
]


@pytest.fixture(autouse=True)
def clear_collection():
    """Clear the collection before each test for isolation."""
    try:
        client.delete("/clear")
    except Exception:
        pass


# ─── Health ────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["collection"] == "video_chunks"
        assert data["count"] == 0

    def test_health_reflects_ingested_count(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/health")
        assert r.json()["count"] == 3


# ─── Ingest ────────────────────────────────────────────────────────

class TestIngest:
    def test_ingest_returns_success(self):
        r = client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        assert r.status_code == 200
        data = r.json()
        assert data["ingested"] == 3
        assert data["errors"] == 0

    def test_ingest_empty_chunks(self):
        r = client.post("/ingest", json={"chunks": []})
        assert r.status_code == 200
        assert r.json()["ingested"] == 0

    def test_ingest_upsert_replaces_existing(self):
        """Re-ingesting the same ID should update, not duplicate."""
        client.post("/ingest", json={"chunks": [SAMPLE_CHUNKS[0]]})
        # Modify content and re-ingest
        modified = {**SAMPLE_CHUNKS[0], "content": "Updated content about black holes"}
        client.post("/ingest", json={"chunks": [modified]})

        r = client.get("/search", params={"query": "Updated content"})
        results = r.json()["results"]
        assert any("Updated content" in res["chunk"]["content"] for res in results)

    def test_ingest_with_metadata(self):
        chunk = {**SAMPLE_CHUNKS[0], "metadata": {"speaker": "Dr. Smith", "confidence": 0.95}}
        r = client.post("/ingest", json={"chunks": [chunk]})
        assert r.json()["ingested"] == 1


# ─── Search ────────────────────────────────────────────────────────

class TestSearch:
    def test_search_returns_relevant_results(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/search", params={"query": "black hole galaxy center"})
        assert r.status_code == 200
        data = r.json()
        assert len(data["results"]) > 0
        assert data["source"] == "vector"
        # Top result should be about black holes
        assert "black hole" in data["results"][0]["chunk"]["content"].lower()

    def test_search_returns_similarity_scores(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/search", params={"query": "quantum physics"})
        results = r.json()["results"]
        assert all("similarity" in res for res in results)
        assert all(0 <= res["similarity"] <= 1 for res in results)

    def test_search_respects_max_results(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/search", params={"query": "the", "maxResults": 1})
        assert len(r.json()["results"]) <= 1

    def test_search_filters_by_video_id(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/search", params={"query": "the", "videoId": "vid-2"})
        results = r.json()["results"]
        assert all(res["chunk"]["videoId"] == "vid-2" for res in results)

    def test_search_empty_index(self):
        r = client.get("/search", params={"query": "anything"})
        assert r.status_code == 200
        assert len(r.json()["results"]) == 0

    def test_search_respects_min_similarity(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        # Very high threshold should return nothing
        r = client.get("/search", params={"query": "xyzzy", "minSimilarity": 0.99})
        assert len(r.json()["results"]) == 0

    def test_search_includes_timing(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/search", params={"query": "quantum"})
        data = r.json()
        assert "searchTimeMs" in data
        assert data["searchTimeMs"] > 0


# ─── Stats ─────────────────────────────────────────────────────────

class TestStats:
    def test_stats_empty(self):
        r = client.get("/stats")
        assert r.status_code == 200
        data = r.json()
        assert data["total_chunks"] == 0
        assert data["videos"] == []

    def test_stats_after_ingest(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        r = client.get("/stats")
        data = r.json()
        assert data["total_chunks"] == 3
        assert "vid-1" in data["videos"]
        assert "vid-2" in data["videos"]
        assert data["types"]["transcript"] == 2
        assert data["types"]["frame_description"] == 1


# ─── Clear ─────────────────────────────────────────────────────────

class TestClear:
    def test_clear_removes_all_data(self):
        client.post("/ingest", json={"chunks": SAMPLE_CHUNKS})
        assert client.get("/health").json()["count"] == 3

        r = client.delete("/clear")
        assert r.status_code == 200
        assert client.get("/health").json()["count"] == 0
