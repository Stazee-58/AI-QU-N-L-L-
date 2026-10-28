-- Khởi tạo Database và extension pgvector nếu có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Cố gắng bật pgvector nếu image postgres hỗ trợ
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not available in this postgres image, continuing without it for G1.';
END $$;
