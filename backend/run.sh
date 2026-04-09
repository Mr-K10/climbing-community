source venv/bin/activate
DATABASE_URL=postgresql://user:password@localhost:5240/climbing_db uvicorn app.main:app --reload --port 8000