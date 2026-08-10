# AI Workspace

An AI-powered document workspace where users can upload documents, organize them, and chat with their content using AI.

## Features

- 📄 Upload PDF, DOCX, and TXT files
- 📁 Organize documents in workspaces
- 🤖 AI-powered Q&A with document content
- 💬 Real-time chat with WebSockets
- 🔍 Semantic search using embeddings
- ⚡ Background processing with Celery
- 🎨 Modern React frontend with TypeScript

## Tech Stack

### Backend
- Django + Django REST Framework
- PostgreSQL with pgvector (optional, falls back to JSON)
- Redis + Celery for background tasks
- Channels + Daphne for WebSockets
- JWT Authentication
- Google Gemini API for AI

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- Redis

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-workspace.git
cd ai-workspace


### Backend setup
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Create PostgreSQL database
createdb workspace

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver


### Frontend Setup
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=/api" > .env

# Start development server
npm run dev


### Redis Setup (for Celery & WebSockets)
Windows: Download from https://github.com/microsoftarchive/redis/releases
Mac: brew install redis
Linux: sudo apt-get install redis-server


# Start Redis
redis-server


### Celery Worker
cd backend
celery -A config worker -l info


### WebSocket Server (Optional)
cd backend
daphne -p 8000 config.asgi:application


### API Endpoints

## Authentication
POST /api/auth/register/ - Register user

POST /api/auth/login/ - Login

POST /api/auth/token/refresh/ - Refresh token

## Workspaces
GET /api/workspaces/ - List workspaces

POST /api/workspaces/ - Create workspace

GET /api/workspaces/{id}/ - Get workspace

PUT /api/workspaces/{id}/ - Update workspace

DELETE /api/workspaces/{id}/ - Delete workspace

## Documents
POST /api/workspaces/{id}/upload_document/ - Upload document

GET /api/workspaces/{id}/documents/ - List documents

DELETE /api/documents/{id}/ - Delete document

## AI
POST /api/ai/query/ - Query documents with AI

POST /api/ai/process_documents/ - Process documents for AI

## Conversations
GET /api/conversations/ - List conversations

POST /api/conversations/ - Create conversation

POST /api/conversations/{id}/send_message/ - Send message

### Usage
Open http://localhost:3000

Create a workspace

Upload PDF, DOCX, or TXT files

Process documents for AI (creates embeddings)

Start chatting with your documents

### Testing
cd backend
pytest

### Project Structure
ai-workspace/
├── backend/
│   ├── apps/
│   │   ├── ai/           # AI & RAG service
│   │   ├── conversations/ # Chat & messages
│   │   ├── users/        # User management
│   │   └── workspaces/   # Workspace & documents
│   ├── config/           # Django settings
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── package.json
└── README.md

### License
MIT

### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.