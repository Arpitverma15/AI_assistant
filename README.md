# AI Assistant

An AI-powered learning assistant with document analysis, flashcards, quizzes, and chat features.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **AI:** Google Gemini API

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB running
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your actual values
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
Create a `.env` file in the backend folder using `.env.example` as a template:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `MONGODB_URI` - Your MongoDB connection string
- `PORT` - Server port (default 8000)
