-- Add HNSW index on articles.embedding for fast cosine similarity search.
-- HNSW provides much better query performance than sequential scan for pgvector.
-- m=16, ef_construction=64 are reasonable defaults for ~100k articles.

CREATE INDEX CONCURRENTLY IF NOT EXISTS articles_embedding_hnsw_idx
  ON articles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
