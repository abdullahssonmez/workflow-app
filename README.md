# Workflow Management System

## Overview
Workflow Management System is a full-stack web application designed for processing business workflows, managing customer requests, and coordinating inter-departmental tasks. The architecture leverages a decoupled frontend and backend approach, utilizing real-time bidirectional event-based communication for synchronous state updates.

## System Architecture

### Frontend
- **Framework**: React.js with Vite for optimized component compilation and sub-second HMR.
- **Styling**: Tailwind CSS, utilizing a utility-first approach for consistent UI metrics.
- **Routing**: React Router DOM enforcing proper application state boundaries.

### Backend
- **Core**: Node.js and Express.js providing RESTful API endpoints.
- **Persistence**: PostgreSQL, managed with robust connection pooling.
- **Asynchronous Communication**: Socket.IO serving low-latency web sockets.
- **Authentication**: JWT-based stateless authentication with bcrypt password hashing mechanisms.

### Infrastructure
- **Reverse Proxy**: Nginx.
- **Process Management**: PM2 configured for execution and automated fallback.
- **Third-party Integrations**: SMTP for transactional emails, Webhook/HTTP integration for NetGSM SMS services.

## Application Structure
- `client/` - Frontend single-page application (SPA).
- `server/` - Backend Node.js service containing controllers, routes, and data models.
- `ecosystem.config.example.js` - Baseline declarative configuration for PM2.
- `nginx.conf` - Base Nginx directives for static file serving and reverse proxy to the Node.js API.
- `MANUAL_GUIDE.md` - Standard operating procedure for manual bare-metal deployment.

## Installation

### Prerequisites
- Node.js (v18.x or higher recommended)
- PostgreSQL (v14.x or higher)

### Environment Configuration
1. Clone the repository and navigate to the `server` directory.
2. Replicate the example environment variable file:
   ```bash
   cp .env.example .env
   ```
3. Populate the `.env` parameters corresponding to your local PostgreSQL instance and cryptographic secrets.

### Backend Setup
Execute the following commands within the `/server` directory to provision modules and initialize the API:
```bash
npm install
npm run dev
```
The REST API defaults to listening on TCP port 5000.

### Frontend Setup
Execute the following commands within the `/client` directory to initiate the development environment:
```bash
npm install
npm run dev
```
The SPA automatically binds to the local Vite dev server on port 5173.

## Deployment Guidelines
Refer to the `MANUAL_GUIDE.md` document for structural deployment parameters onto a Linux-based production server.
