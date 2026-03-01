# Zot Quests

A gamified quest-completion web application that encourages college students to curb their boredom or destress by completing quests and earn rewards. Built with React, FastAPI, and Supabase.

## Overview

Zot Quests is a full-stack web application where users can log in, view available quests, complete them by submitting proof through images, earn coins to customize their Petrs, and compete on a leaderboard. The app features a dynamic quest generation system powered by Google's Gemini 2.5 Flash and a gamification system with outfit cosmetics and coin rewards.

## Features

- **User Authentication**: Secure login and password reset with Supabase Auth
- **Dynamic Quest Generation**: AI-powered quest creation with image verification for completion of quests
- **Gamification**: Earn coins by completing quests and compete on the leaderboard
- **Cosmetics System**: Purchase and equip outfit skins using earned coins
- **Performance Tracking**: View completed quests and track progress
- **Responsive Design**: User-friendly interface built with React
- **Interactive Leaderboard**: Interactable leaderboard to view other players' Petrs

## Tech Stack

### Frontend
- **React** - UI component library
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Supabase JS Client** - Database and authentication
- **CSS** - Custom styling for responsive design

### Backend
- **FastAPI** - Modern Python web framework
- **Gemini 2.5 Flash** - AI-powered quest generation and image verifcation
- **Python-Jose** - JWT authentication
- **Supabase** - Postgre database, authentication, and storage

## Project Structure

```
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── pages/           # Page components (Landing, Login, Leaderboard, etc.)
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context for state management
│   │   ├── lib/             # Utility functions and API calls
│   │   └── data/            # Static data (quests, outfits)
│   └── package.json
├── backend/                  # FastAPI server
│   ├── src/
│   │   ├── main.py          # Entry point and API routes
│   │   ├── api.py           # API endpoint handlers
│   │   ├── auth.py          # Authentication logic
│   │   ├── quest_generation.py   # AI-powered quest generation
│   │   └── quest_verification.py # Quest completion verification
│   └── requirements.txt
├── api/                      # Serverless API functions (Vercel)
└── DEPLOYMENT.md            # Deployment instructions
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- Supabase account
- Google's Gemini 2.5 Flash API key (for quest generation)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
python -m src.main
```

The API will be available at `http://localhost:8000`.

### Environment Variables

Create a `.env` file in the `frontend` directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file in the `backend` directory:

```
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
QUEST_GENERATION_GEMINI_API_KEY=your_gemini_2.5_flash_api_key
QUEST_VERIFICATION_GEMINI_API_KEY=your_gemini_2.5_flash_api_key
```

## Leaderboard Ranking

The leaderboard ranks players by **total coins earned** or **total quests completed**. This encourages users to complete more quests and earn higher coin rewards to compete.

## Database Schema

View the SQL setup files:
- [Game State Table](supabase-game-state.sql)
- [User Profiles Table](supabase-profiles-table.sql)

## Development Guide

For more detailed information on the architecture and development:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## License

This project is open source and available under the MIT License.
