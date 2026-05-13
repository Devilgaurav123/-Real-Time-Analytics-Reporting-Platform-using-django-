Real-Time Analytics & Reporting Platform

A full-stack enterprise-grade Real-Time Analytics Platform built using:

Django + Django REST Framework
Django Channels (WebSockets)
Celery + Redis
PostgreSQL
React.js + Vite
Bootstrap
Recharts
JWT Authentication

This platform supports real-time event ingestion, live dashboards, alerts, reports, analytics visualization, WebSocket updates, role-based access, and dynamic dashboard management.

🚀 Features
🔐 Authentication & Access Control
JWT Authentication
Login & Registration
Role-based access control
Team-based dashboard access
Public shared dashboards
Protected frontend routes

📊 Dashboard Features
Dynamic dashboard creation
Dashboard templates
Real-time analytics
Live event stream
Drag & drop widgets
Widget resize support
Dashboard fullscreen mode
Dashboard sharing
Drill-down analytics
Export chart data
Date range filters
Custom filters
KPI cards
Line, Bar, Pie, Table widgets
⚡ Real-Time Features
Django Channels WebSockets
Live dashboard updates
Live alert notifications
WebSocket auto reconnect
Real-time event ingestion
Real-time analytics refresh

📥 Event Ingestion System
Single event ingestion
Batch event ingestion
CSV upload support
Webhook ingestion
API Key management
API Key rotation
API Key revocation
Time-series optimized event storage

🚨 Alerts & Notifications
Threshold alerts
Email notifications
Webhook notifications
Alert history
In-app notifications
Alert mute & snooze
📄 Reporting System
Scheduled reports
PDF report support
Downloadable reports
Report history
PNG snapshot generation

🏢 Organization Management
Multi-organization support
Team member management
Invite system
Role management

🛠 Tech Stack
Backend
Django
Django REST Framework
Django Channels
Celery
Redis
PostgreSQL
Simple JWT

Frontend
React.js
Vite
Bootstrap
Recharts
React Grid Layout
React Toastify

📂 Project Structure
backend/
│
├── accounts/
├── alerts/
├── dashboards/
├── ingestion/
├── organizations/
├── websocket/
│
├── manage.py
└── requirements.txt

frontend/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── pages/
│   └── routes/
│
├── package.json
└── vite.config.js

⚙️ Backend Setup
1. Clone Repository
git clone https://github.com/YOUR_USERNAME/Real-Time-Analytics-Reporting-Platform.git

3. Create Virtual Environment
python -m venv env

5. Activate Environment
Windows
env\Scripts\activate
Linux/Mac
source env/bin/activate
Install Dependencies
pip install -r requirements.txt
Configure PostgreSQL

Update .env or settings.py

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "analytics_db",
        "USER": "postgres",
        "PASSWORD": "your_password",
        "HOST": "localhost",
        "PORT": "5432",
    }
}
Run Migrations
python manage.py makemigrations
python manage.py migrate
Create Superuser
python manage.py createsuperuser
Start Redis
redis-server
Start Celery Worker
celery -A analytics_platform worker --pool=solo -l info
Run Backend
python manage.py runserver
⚛️ Frontend Setup
Install Dependencies
npm install
Run Frontend
npm run dev

🌐 WebSocket URL
ws://127.0.0.1:8000/ws/dashboard/<dashboard_id>/

🔑 Default API Base URL

http://127.0.0.1:8000/api/
📡 Main APIs
Authentication
/api/accounts/register/
/api/accounts/login/
Dashboards
/api/dashboards/create/
/api/dashboards/list/
/api/dashboards/analytics/<id>/
Events
/api/ingestion/single-event/
/api/ingestion/batch-event/
/api/ingestion/upload-csv/
Alerts
/api/alerts/create/
/api/alerts/list/
📸 Screenshots

Add your project screenshots here.

📌 Future Improvements
AI analytics insights
Predictive analytics
Advanced RBAC
Docker deployment
Kubernetes support
Grafana integration
Advanced report builder
👨‍💻 Developer
Gaurav Kapade

Python Full Stack Developer

Django
React.js
Real-Time Systems
WebSocket Applications
Analytics Platforms
📜 License

This project is developed for educational and portfolio purposes.
