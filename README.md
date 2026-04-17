# Workflow & Request Management System 🚀

A comprehensive, full-stack web application designed to streamline business operations, handle customer requests (tickets), and facilitate real-time team collaboration. 

This project was built focusing on performance, scalability, and an intuitive user experience.

## ✨ Key Features

- **Real-Time Communication**: Instant messaging and live notifications powered by Socket.IO.
- **Customer & Workflow Management**: Create, track, and update customer requests seamlessly through custom stages.
- **Task & Calendar Integration**: Team members can easily track their daily tasks and deadlines on an interactive calendar.
- **Secure File Uploads**: Efficient document handling and secure file storage (Multer).
- **Multi-Channel Notifications**: Built-in integrations for SMTP (Email) and NetGSM (SMS) for critical alerts.
- **Role-Based Access Control (RBAC)**: Secure routing and data access policies based on user permissions.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js powered by Vite for lightning-fast HMR and building.
- **Styling:** Tailwind CSS for a highly responsive, modern UI.
- **State Management & Routing:** React Router DOM.

### Backend
- **Core:** Node.js, Express.js
- **Database:** PostgreSQL (with robust DB connection pooling).
- **Real-Time Engine:** Socket.IO
- **Security:** JWT Authentication, bcrypt password hashing.

### Infrastructure & Deployment
- **Web Server / Proxy:** Nginx (with Let's Encrypt SSL)
- **Process Manager:** PM2 (running the Node app persistently).
- **Deployment Platform:** Ubuntu / Linux server

## 📂 Project Structure

The repository is organized seamlessly into client and server domains:

- `/client` - Contains all frontend React components, pages, and assets.
- `/server` - Houses the Express API, controllers, routing, and database configurations.
- `ecosystem.config.example.js` - Sample PM2 configuration for zero-downtime server operations.
- `nginx.conf` - Production Nginx reverse-proxy setup.
- `MANUAL_GUIDE.md` - Complete documentation for manual server deployment.

## 🚀 Getting Started (Local Development)

### 1. Database Setup
Ensure PostgreSQL is running locally and create your database:
```sql
CREATE DATABASE workflow_db;
```

### 2. Backend Setup
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Copy the environment file: `cp .env.example .env` and fill in your DB credentials.
4. Run locally: `npm run dev` (Runs on port 5000)

### 3. Frontend Setup
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Access the UI at `http://localhost:5173`

## 📖 Deployment

For detailed production deployment instructions using FileZilla, PM2, and Nginx, please refer to the [Manual Deployment Guide](./MANUAL_GUIDE.md).
