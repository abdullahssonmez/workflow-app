# Manual Server Deployment Guide

This guide provides step-by-step instructions on how to upload and run your project on your server using FileZilla.

## Prerequisites
The frontend has already been built and the configurations are set up on your local machine. The prepared files are:
- `client/dist` directory (Frontend files)
- `server` directory (Backend code)
- `ecosystem.config.js` (PM2 configuration)
- `nginx.conf` (Server configuration)
- `.env.production` (Backend settings)

## Step 1: File Transfer with FileZilla

1.  **Open FileZilla** and connect to your server (`IP: 104.247.173.246`, User: `root`).
2.  Navigate to the `/var/www` directory on the server. If it doesn't exist, create it.
3.  Create a folder named `workflow-app` inside `/var/www`.
4.  **Upload the Files:**
    *   **Frontend**: Upload **everything inside** your local `client/dist` folder to the `/var/www/workflow-app/dist` directory on the server (Create the `dist` folder first).
    *   **Backend**: Upload your local `server` folder as `/var/www/workflow-app/server`. (Do **not** upload the `node_modules` folder! It takes too long).
    *   **Configuration**: 
        *   Upload `ecosystem.config.js` to `/var/www/workflow-app/ecosystem.config.js`.
        *   Upload `.env.production` as `/var/www/workflow-app/server/.env` (Rename it to `.env`).

**The File Structure Should Look Like This:**
```text
/var/www/workflow-app/
├── dist/               (Frontend files: index.html, assets, etc.)
├── server/             (Backend files)
│   ├── src/
│   ├── .env            (The uploaded .env.production file)
│   ├── package.json
│   └── ...
└── ecosystem.config.js
```

## Step 2: Server Setup (Terminal / SSH)

Connect to your server via SSH and run the following commands in sequence:

1.  **Backend Setup:**
    ```bash
    cd /var/www/workflow-app/server
    npm install
    ```

2.  **Starting the Application (PM2):**
    ```bash
    cd /var/www/workflow-app
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

3.  **Nginx Configuration:**
    *   Copy the contents of the `nginx.conf` file created on your local machine.
    *   Open the file on the server:
        ```bash
        nano /etc/nginx/sites-available/workflow-app
        ```
    *   Paste the copied content and save (`CTRL+O`, `Enter`, `CTRL+X`).
    *   Enable the configuration:
        ```bash
        ln -s /etc/nginx/sites-available/workflow-app /etc/nginx/sites-enabled/
        rm /etc/nginx/sites-enabled/default  # Delete default config (If exists)
        nginx -t  # Check for syntax errors
        systemctl restart nginx
        ```

## Congratulations! 🎉
You can now view your application by navigating to `http://104.247.173.246` in your browser.
