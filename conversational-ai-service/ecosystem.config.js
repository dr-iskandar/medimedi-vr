module.exports = {
  apps: [{
    name: 'conversational-ai-service',
    script: 'server.js',
    cwd: '/var/www/medimedi-vr/conversational-ai-service',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Auto restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Restart policy
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    log_file: '/var/log/pm2/conversational-ai-service.log',
    out_file: '/var/log/pm2/conversational-ai-service-out.log',
    error_file: '/var/log/pm2/conversational-ai-service-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Advanced options
    node_args: '--max-old-space-size=1024',
    
    // Merge logs
    merge_logs: true,
    
    // Time zone
    time: true
  }]
};