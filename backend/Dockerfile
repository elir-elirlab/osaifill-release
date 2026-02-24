FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy metadata and source code (required for 'pip install .')
COPY pyproject.toml README.md ./
COPY src/ ./src/

# Install the project and its dependencies
RUN pip install --no-cache-dir .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Environment variables
ENV DATABASE_URL=sqlite:////app/data/osaifill.db
ENV PORT=8000

# Expose port (internal to docker network)
EXPOSE 8000

CMD ["uvicorn", "osaifill.main:app", "--host", "0.0.0.0", "--port", "8000"]
