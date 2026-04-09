# Climbing Community - Backend API

> The intelligence engine powering the Climbing Community ecosystem, featuring FastAPI, asynchronous workers, and agentic AI integration.

## 🏗 Architecture

The backend is built with **FastAPI** and uses a service-oriented architecture to handle both synchronous API requests and asynchronous background tasks.

### Core Components
- **FastAPI Core**: Handles authentication, profile management, and quiz orchestration.
- **LLM Service**: An agentic bridge to Google Gemini, handling adaptive question generation, image synthesis, and knowledge delta extraction.
- **Worker System**: Processes quiz sessions asynchronously to update user knowledge graphs without blocking the main thread.
- **SQLAlchemy + Alembic**: Robust ORM and migration management for the user profile database.

## 🧠 Agentic AI Implementation

The backend integrates multiple specialized agents:

1. **Question Generator Agent**:
   - Analyzes user discipline (Sport/Trad/Bouldering) and current grade.
   - Generates MCQ scenarios in real-time.
   - Triggers multimodal (Vision) image generation for visual safety questions.
   
2. **Profile Manager Agent**:
   - Analyzes quiz performance (`AnswerLog`) to identify specific strengths/weaknesses.
   - Computes updates for the Skill Radar chart (0-100 scale).
   - Generates natural language timeline summaries of user progression.

## 🛠 Tech Stack Details
- **Framework**: FastAPI (uvicorn)
- **Database**: PostgreSQL (Production) / SQLite (Dev)
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Task Queue**: BackgroundTasks (Next: Celery/Redis)
- **AI**: Gemini 1.5 Pro / Flash

## 🚀 Development Setup

### Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=sqlite:///./sql_app.db
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_gemini_key
```

### Running the API
```bash
./run.sh
```
The documentation will be available at `http://localhost:8000/docs`.

## 🧪 Testing
```bash
pytest
```

---

## 🗺 Future implementation (Phase 3 & 4)
- **Training Coach Agent Integration**: Implementation of the Hangboard training protocol generator.
- **Safety Auditor Middleware**: Intercepting quiz responses for critical safety flags.
- **Partner Matching Logic**: Bipartite matching algorithm implementation.
