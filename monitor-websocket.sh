#!/bin/bash

# 📊 WebSocket Service Monitoring
# Monitor PM2 service dan WebSocket connections

SERVER_IP="156.67.217.39"
SERVICE_NAME="conversational-ai-service"

echo "🔍 Monitoring WebSocket Service"
echo "=============================="

ssh root@$SERVER_IP << EOF
echo "📊 PM2 Status:"
pm2 status $SERVICE_NAME

echo ""
echo "📈 Memory & CPU Usage:"
pm2 monit --no-daemon | head -20

echo ""
echo "📝 Recent Logs (last 20 lines):"
pm2 logs $SERVICE_NAME --lines 20

echo ""
echo "🌐 Network Connections:"
netstat -tulpn | grep :3001

echo ""
echo "🔗 WebSocket Test:"
curl -I http://localhost:3001/health
EOF