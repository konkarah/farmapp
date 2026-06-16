module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev -- -p 3000 -H 0.0.0.0',
      cwd: '/home/ec2-user/farm-WORKER-FIXED/farm-management-system/frontend',
      env: {
        NODE_ENV: 'development',
        NEXT_PUBLIC_API_URL: 'http://32.192.225.100:8070'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/frontend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/frontend-out.log',
      log_file: '/home/ec2-user/.pm2/logs/frontend-combined.log',
      time: true
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ec2-user/farm-WORKER-FIXED/farm-management-system/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 8070,
        DB_HOST: '127.0.0.1',
        DB_USER: 'lore',
        DB_PASSWORD: 'Password123!@#',
        DB_NAME: 'farm_management_prod',
        JWT_SECRET: 'your-secret-key-here'  // ← REPLACE WITH YOUR ACTUAL JWT_SECRET
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/backend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/backend-out.log',
      log_file: '/home/ec2-user/.pm2/logs/backend-combined.log',
      time: true
    }
  ]
};
