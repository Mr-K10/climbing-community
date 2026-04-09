# Climbing Community - Frontend

> A modern, interactive interface for climbing knowledge assessment and skill tracking, built with Next.js 15 and Tailwind CSS v4.

## 🎨 Design Philosophy

The frontend is designed to be highly interactive and visual, focused on the "Climber's Experience":
- **Adaptive UI**: The onboarding and quiz flows react to user inputs in real-time.
- **Visual Feedback**: Uses **Recharts** for the Skill Radar and Timeline visualization.
- **Accessibility**: Built with Radix-based components and a focus on readable climbing-specific content.

## 🚀 Features

### 1. Interactive Onboarding
- Smooth step-by-step preference collection.
- Real-time previews of climbing disciplines and grade selections.

### 2. Adaptive Quiz Interface
- Dynamic question loading with skeleton states.
- Multimodal support for viewing AI-generated climbing scenarios.
- Instant feedback with LLM-generated explanations for correct/incorrect answers.

### 3. Skill Dashboard
- Integrated **Radar Chart** displaying current proficiency across 6 dimensions.
- **Historical Timeline** showing the evolution of the climber's knowledge graph.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **State Management**: React Hooks & Context API
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI / Shadcn-style custom components
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Auth**: NextAuth.js v5

## 💻 Development

### Setup
```bash
cd frontend
npm install
```

### Configuration
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_SECRET=your_auth_secret
```

### Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗺 Roadmap (Phase 3 & 4)
- **Push Notification Integration**: For training alerts from the Hangboard Coach.
- **Real-time Collaboration**: Shared quiz sessions and partner search UI.
- **Offline Support**: Local storage for quiz sessions in low-signal crag environments.
