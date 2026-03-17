module.exports = {
  apps: [
    {
      name: "cms",
      cwd: "/var/www/cms",
      script: "./scripts/run-admin.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: "3001"
      }
    }
  ]
};
