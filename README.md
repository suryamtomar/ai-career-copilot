# AI Career Copilot 🚀

**An AI-powered career guidance platform that helps users organize their career profiles, identify skill gaps, generate personalized career roadmaps, and prepare for interviews.**

AI Career Copilot is a full-stack web application built with React, TypeScript, FastAPI, PostgreSQL, and AI integration.

## ✨ Features

- **Career Profile Management** — Create, view, update, and delete career profiles.
- **AI Career Planning** — Generate personalized career plans based on profile information and career goals.
- **Skill Gap Analysis** — Identify skills to improve for a target career role.
- **Interview Preparation** — Generate interview questions for practice.
- **Interview Feedback** — Receive AI-generated feedback on interview answers.
- **Report Export** — Export supported career reports as PDF using the browser's print functionality.
- **Responsive Interface** — Navigate the application on desktop and mobile-sized screens.
- **Theme Switching** — Switch between dark and light themes.
- **PostgreSQL Integration** — Persist career profile data in a relational database.

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- CSS
- React Markdown
- remark-gfm

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- Psycopg

### Database and AI
- PostgreSQL
- Gemini API integration

## 🏗️ Architecture

```text
AI Career Copilot
│
├── frontend/
│   └── React + TypeScript + Vite
│       └── User interface
│
└── backend/
    ├── FastAPI
    │   ├── REST API endpoints
    │   ├── Career planning
    │   ├── Skill gap analysis
    │   └── Interview preparation
    │
    └── PostgreSQL
        └── User profile storage
```

The frontend communicates with the FastAPI backend through API requests. The backend handles application logic, database operations, and AI-powered features.

## 📋 Prerequisites

Install the following before running the project:

- Node.js and npm
- Python 3
- PostgreSQL
- Git

You will also need a valid Gemini API key if you want to use AI features that depend on the Gemini API.

## ⚙️ Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/suryamtomar/ai-career-copilot.git
cd ai-career-copilot
```

### 2. Configure the backend

Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows — Command Prompt:**

```bat
.venv\Scripts\activate
```

**Windows — PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install fastapi uvicorn "psycopg[binary]" python-dotenv
```

Create a `.env` file inside the `backend/` directory and configure your local settings:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_career_copilot
DB_USER=postgres
DB_PASSWORD=your_local_database_password

GEMINI_API_KEY=your_gemini_api_key
```

Replace the example values with your own configuration. Keep this file private and never commit actual passwords or API keys.

Create a PostgreSQL database named `ai_career_copilot` if it does not already exist.

> Install any additional dependencies required by the current `backend/main.py` and project configuration. The installation command above covers the core dependencies, not necessarily every dependency used by the application.

### 3. Start the backend

From the `backend/` directory, with the virtual environment activated:

```bash
uvicorn main:app --reload
```

The backend should be available at:

- API base URL: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

If your frontend uses a Vite proxy for `/api`, ensure its target matches the backend URL.

## 🔐 Environment Variables

Configure environment variables locally rather than hardcoding secrets in source files.

| Variable | Purpose |
|---|---|
| `DB_HOST` | PostgreSQL server hostname |
| `DB_PORT` | PostgreSQL server port |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `GEMINI_API_KEY` | API key for Gemini integration |

The exact variables required depend on the current backend implementation. Check `backend/main.py` and its configuration before deployment.

## 🧪 Verification

After starting both services:

1. Open the frontend in your browser.
2. Confirm the backend connection indicator is healthy.
3. Open `http://localhost:8000/docs` to inspect the API.
4. Test creating, editing, viewing, and deleting a profile.
5. Test career planning, skill gap analysis, and interview preparation.
6. Verify report exports and theme switching.
7. Check the browser console and backend terminal for errors.

## 🔒 Security Notes

- Never commit `.env` files, passwords, or API keys.
- Keep `.venv/`, `node_modules/`, and generated build files out of Git.
- Configure production secrets through your hosting provider's environment settings.
- Use appropriate database access controls in production.
- Configure CORS and other security settings for the actual production domains before deployment.

## 🚀 Deployment

Deployment instructions will be added after the hosting platform, database provider, environment configuration, and production settings are finalized.

## 🗺️ Project Roadmap

- [x] Initial project setup
- [x] Backend API and PostgreSQL integration
- [x] Core career guidance features
- [x] AI-powered features
- [x] UI/UX improvements
- [ ] Final documentation and repository review
- [ ] Production deployment

## 👨‍💻 Author

**Suryam Tomar**

AI Career Copilot is a portfolio project focused on full-stack development and AI-powered career assistance.

## 📄 License

No license has been specified yet. Add a license if you intend to define how others may use, modify, or distribute this project.