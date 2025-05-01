# Calendar Manager Web App

A full-stack calendar application with comprehensive event management capabilities.

## Features

- 📅 Dynamic month-by-month calendar generation
- ✅ Add/edit/delete events with click interactions
- 🔍 Fuzzy search across all events (Fuse.js integration)
- 🪟 Interactive popup interface for event management
- 📱 Responsive design for desktop and mobile
- 🌐 REST API backend with Flask/CORS
- 🔄 Real-time updates without page refresh

## Tech Stack

- **Frontend**: Vanilla JS, CSS Grid, Fuse.js
- **Backend**: Python Flask, JSON file storage
- **Deployment**:
  - Backend: Render (Python)
  - Frontend: GitHub Pages

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/numbaoneninja/my-calendar-app.git
   cd my-calendar-app

   ```

2. Backend setup:

   ```bash
   cd backend
   pip install -r requirements.txt
   python server.py

   ```

3. Frontend:
   - Open `index.html` in any modern browser
   - Ensure backend is running for full functionality

## API Endpoints

- `GET /api/events` - Get all events grouped by date
- `POST /api/events` - Create new event
- `DELETE /api/events/<date>/<event_id>` - Delete specific event
- `GET /api/events/all` - Get all events (flat structure)

## Live Demos

- Frontend: [https://numbaoneninja.github.io/my-calendar-app](https://numbaoneninja.github.io/my-calendar-app)
- Backend API: [https://my-calendar-app-1.onrender.com/api/events](https://my-calendar-app-1.onrender.com/api/events)

## Key Improvements

- Event popup interface for managing daily events
- Persistent storage using JSON file system
- Comprehensive error handling in API
- Search-as-you-type functionality
- Cross-browser compatibility

> Note: Render free tier may cause backend to spin down after inactivity - allow 30-60 seconds for first response after inactivity period.
