# Osaifill Backend

This is the FastAPI-based backend for Osaifill, a multi-source budget management application.

## Prerequisites

- Python 3.10 or higher
- SQLite

## Setup for Development

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On macOS/Linux: source venv/bin/activate
   ```

3. **Install dependencies in editable mode with development tools:**
   ```bash
   pip install -e ".[dev]"
   ```

## Running the Server

Start the development server with auto-reload:

```bash
uvicorn osaifill.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can explore the interactive API documentation at `http://localhost:8000/docs`.

## Database

By default, the application uses a local SQLite database named `osaifill.db` in the `backend/` directory.
To customize the database location, set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL=sqlite:///path/to/your/database.db
```

## Testing & Quality Assurance

### Running Tests
We use `pytest` for unit and integration testing:
```bash
pytest
```

### Type Checking
We use `mypy` for static type checking:
```bash
mypy src
```

## Docker

You can also run the backend using the Docker Compose setup in the root directory. Please refer to the root [README.md](../README.md) for more details.

## License

This project is licensed under the [MIT License](../LICENSE).
