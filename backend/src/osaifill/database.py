from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
from typing import Generator
from dotenv import load_dotenv, find_dotenv

# .envファイルを親ディレクトリまで遡って検索
load_dotenv(find_dotenv())

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./osaifill.db")

engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    ),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
