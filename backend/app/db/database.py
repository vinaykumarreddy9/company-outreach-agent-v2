from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_DB_URL") or os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip("'").strip('"')

# Handle missing DB URL for tests/initialization
if not DATABASE_URL:
    print("Warning: NEON_DB_URL not found. Using local SQLite for runtime initialization.")
    DATABASE_URL = "sqlite:///./fallback.db"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True, # Validate connection health before use
    pool_recycle=300,    # Recycle connections every 5 minutes
    pool_size=10,        # Increase pool size for parallel agent demands
    max_overflow=20     # Allow temporary spikes in connection usage
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
