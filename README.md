# Climbing Community App (Agentic Evolution)

> A multi-agent ecosystem designed to elevate the climbing experience through adaptive knowledge assessment, real-time skill tracking, and intelligent recommendation systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_Pro-blue.svg)](https://deepmind.google/technologies/gemini/)

## Why This Exists

Climbing is a high-consequence sport where knowledge gaps can lead to safety incidents or performance plateaus. Traditional resources are often static, generic, and disconnected from a climber's actual progression. 

The **Climbing Community App** solves this by leveraging **Agentic AI** to build a dynamic "Knowledge Graph" for every user. It doesn't just show routes; it assesses your technical depth, identifies safety blind spots, and suggests personalized growth paths based on your real climbing history and preferences.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy, Alembic.
- **AI Core**: Google Gemini Pro (LLM) & Gemini Pro Vision (Multimodal).
- **Data Persistence**: SQLite (Development) / PostgreSQL (Production), Redis (Caching).
- **Infrastructure**: Docker, Docker Compose.

## 🚀 Key Features

### 1. Adaptive Knowledge Assessment (Phase 1 & 2)
The core of the application is an **LLM-driven Adaptive Quiz**. Unlike static quizzes, our **Question Generator Agent** analyzes your discipline (Bouldering, Sport, Trad), your grade, and your previous answers to generate real-time questions.
- **Visual Scenarios**: Multimodal integration generates photorealistic climbing scenarios for safety assessment.
- **Dual Grading Support**: Automatically translates between French/YDS and Font/V-Scale systems.
- **Real-time Assessment**: Individual answer syncing with background "grading" to update your profile.

### 2. Personal Skill Radar
Your profile is mapped onto a 6-node **Radar Chart** tracking:
- **Safety**: Anchor systems, belaying, and risk management.
- **Technique**: Movement precision and efficiency.
- **Local Beta**: Regional crag knowledge and access etiquette.
- **Rope Skills**: Technical ropework for sport and trad.
- **Training Science**: Physiology, recovery, and hypertrophy.
- **Mindset**: Mental game and fear management.

### 3. Historical Timeline
Every quiz, preference change, and achievement creates an immutable entry in your **Profile Timeline**, allowing you to visualize your progression over months and years.

---

## 🗺 Roadmap (Phase 3 & Beyond)

As outlined in our [Implementation Plan](workspace/implementation_plan.md), the next phases focus on expanding the agentic ecosystem:

### Phase 3: Specialized Training & Safety
- **Hangboard Training Coach Agent**: Analyzes your timeline to detect plateaus. If your progress stalls, the agent generates a customized 4-week fingerboard protocol tailored to your specific grip weaknesses.
- **Safety Systems Auditor**: A specialized agent that monitors technical quiz performance. TERRIBLE answers to safety questions (e.g., tethering errors) trigger an "Emergency Intervention" flow with mandatory instructional content.

### Phase 4: Social & Spatial Intelligence
- **Intelligent Partner Matchmaker**: Matches climbers not just by grade, but by *complementary goals*. (e.g., A climber wanting to learn Trad is matched with an experienced Trad leader looking for a motivated follower).
- **Route Recommendation Agent**: Synthesizes your skill radar with external databases (OpenBeta/Mountain Project) to recommend routes that are either "Safe Projects" or "Skill Builders" for your current level.

---

## 💻 Getting Started

### Prerequisites
- Docker & Docker Compose
- Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/climbing-community.git
   cd climbing-community
   ```

2. **Environment Setup**:
   Copy `.env.example` in both `backend` and `frontend` folders and fill in your credentials (especially `GOOGLE_API_KEY`).

3. **Launch with Docker**:
   ```bash
   docker-compose up --build
   ```

4. **Access the App**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/docs`

---

## 🤝 Contributing

We welcome contributions from the climbing and dev communities! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the global climbing community.*
