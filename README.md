# AI-Based Smart Complaint Management System

A full-stack MERN application for managing public complaints with AI-powered analysis.

## Features

- **Complaint Registration** – Submit complaints with name, email, title, description, category, and location
- **Complaint Tracking** – View, filter by category/status, and search by location
- **AI Analysis** – Automatic priority detection, department recommendation, complaint summary, and auto-response
- **JWT Authentication** – Secure login/register with bcrypt password hashing
- **Protected Routes** – Status updates and deletions require authentication

## Tech Stack

- **Frontend**: Vite + React, React Router, Axios, react-hot-toast, lucide-react
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas
- **AI**: OpenRouter API (meta-llama/llama-3.1-8b-instruct:free)
- **Deployment**: Render

## Local Development

### Backend
```bash
cd backend
npm install
# Set up .env (already configured)
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# .env already set to http://localhost:5000
npm run dev
# Runs on http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| POST | /api/complaints | Add complaint |
| GET | /api/complaints | Get all complaints |
| GET | /api/complaints/:id | Get complaint by ID |
| PUT | /api/complaints/:id | Update status |
| DELETE | /api/complaints/:id | Delete complaint |
| GET | /api/complaints/search?location= | Search by location |
| POST | /api/ai/analyze | AI analysis |
| GET | /api/ai/status/:id | Poll AI status |

## Deployment on Render

### Backend
1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `PORT` = 10000

### Frontend
1. Create a new **Static Site** on Render
2. Connect your GitHub repo, set root to `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` = your backend Render URL
