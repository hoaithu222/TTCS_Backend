module.exports = {
  apps: [
    {
      name: 'my-love-server',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Restart tự động khi gặp lỗi
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health check
      health_check_grace_period: 3000,
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Wait ready
      wait_ready: true,
      listen_timeout: 8000,
      
      // Error handling
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Environment variables
      env_file: '.env'
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: '127.0.0.1',
      ref: 'origin/main',
      repo: 'git@github.com:username/repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};


