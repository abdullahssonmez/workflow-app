module.exports = {
  apps: [{
    name: "workflow-app",
    script: "./server/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000,
      
      // Database
      DB_USER: "postgres",
      DB_HOST: "localhost",
      DB_NAME: "workflow_db",
      DB_PASSWORD: "your_secure_db_password",
      DB_PORT: 5432,

      // Security
      JWT_SECRET: "your_secure_jwt_secret_key",

      // NetGSM (SMS)
      NETGSM_USER: "your_netgsm_username",
      NETGSM_PASS: "your_netgsm_password",
      NETGSM_HEADER: "YOUR_HEADER",

      // Email (SMTP)
      EMAIL_HOST: "mail.yourdomain.com",
      EMAIL_PORT: 465,
      EMAIL_USER: "your_email@domain.com",
      EMAIL_PASS: "your_email_password",
      EMAIL_FROM_NAME: "YOUR_COMPANY_NAME",

      // Frontend URL
      CLIENT_URL: "http://your_domain_or_ip"
    }
  }]
};
