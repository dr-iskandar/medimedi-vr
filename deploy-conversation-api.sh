#!/bin/bash

# Deploy Conversation Summary API
# This script deploys the conversation summary API to the server

set -e  # Exit on any error

# Configuration
SERVER_IP="156.67.217.39"
SERVER_USER="root"
API_PORT="3002"
API_NAME="conversation-summary-api"
REMOTE_DIR="/var/www/conversation-summary-api"
LOCAL_FILES=("conversation-summary-api.js" "conversation-summary-package.json" "test-conversation-api.js")

echo "🚀 Deploying Conversation Summary API to $SERVER_IP:$API_PORT"
echo "================================================"

# Function to check if server is reachable
check_server_connectivity() {
    echo "🔍 Checking server connectivity..."
    if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
        echo "✅ Server $SERVER_IP is reachable"
    else
        echo "❌ Server $SERVER_IP is not reachable"
        exit 1
    fi
}

# Function to check SSH connection
check_ssh_connection() {
    echo "🔐 Testing SSH connection..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'SSH connection successful'" > /dev/null 2>&1; then
        echo "✅ SSH connection to $SERVER_USER@$SERVER_IP successful"
    else
        echo "❌ SSH connection failed. Please check your SSH keys and server access."
        exit 1
    fi
}

# Function to create remote directory
create_remote_directory() {
    echo "📁 Creating remote directory..."
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"
    echo "✅ Remote directory created: $REMOTE_DIR"
}

# Function to copy files to server
copy_files_to_server() {
    echo "📤 Copying files to server..."
    
    for file in "${LOCAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "   Copying $file..."
            scp "$file" $SERVER_USER@$SERVER_IP:$REMOTE_DIR/
        else
            echo "   ⚠️  Warning: $file not found, skipping..."
        fi
    done
    
    # Rename package.json
    ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && mv conversation-summary-package.json package.json"
    
    echo "✅ Files copied successfully"
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies on server..."
    ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && npm install"
    echo "✅ Dependencies installed"
}

# Function to stop existing service
stop_existing_service() {
    echo "🛑 Stopping existing service..."
    ssh $SERVER_USER@$SERVER_IP "pm2 stop $API_NAME || true"
    ssh $SERVER_USER@$SERVER_IP "pm2 delete $API_NAME || true"
    echo "✅ Existing service stopped"
}

# Function to start service with PM2
start_service() {
    echo "🚀 Starting service with PM2..."
    ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && pm2 start conversation-summary-api.js --name $API_NAME --env production"
    ssh $SERVER_USER@$SERVER_IP "pm2 save"
    echo "✅ Service started with PM2"
}

# Function to configure Nginx (if needed)
configure_nginx() {
    echo "🌐 Configuring Nginx proxy..."
    
    # Create Nginx configuration for the API
    ssh $SERVER_USER@$SERVER_IP "cat > /etc/nginx/sites-available/conversation-summary-api << 'EOF'
server {
    listen 80;
    server_name conversation-api.medimedi.id;
    
    location / {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$API_PORT/health;
        access_log off;
    }
}
EOF"
    
    # Enable the site
    ssh $SERVER_USER@$SERVER_IP "ln -sf /etc/nginx/sites-available/conversation-summary-api /etc/nginx/sites-enabled/"
    
    # Test and reload Nginx
    ssh $SERVER_USER@$SERVER_IP "nginx -t && systemctl reload nginx"
    
    echo "✅ Nginx configured"
}

# Function to check service status
check_service_status() {
    echo "🔍 Checking service status..."
    ssh $SERVER_USER@$SERVER_IP "pm2 status $API_NAME"
    
    echo "\n🌐 Testing API endpoints..."
    sleep 3  # Wait for service to start
    
    # Test health endpoint
    if ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:$API_PORT/health" > /dev/null; then
        echo "✅ Health endpoint is working"
    else
        echo "❌ Health endpoint is not responding"
    fi
    
    # Test conversation summary endpoint
    if ssh $SERVER_USER@$SERVER_IP "curl -s http://localhost:$API_PORT/api/conversation-summary" > /dev/null; then
        echo "✅ Conversation summary endpoint is accessible"
    else
        echo "⚠️  Conversation summary endpoint may need API key validation"
    fi
}

# Function to show deployment summary
show_deployment_summary() {
    echo "\n🎉 Deployment Summary"
    echo "=========================================="
    echo "✅ Conversation Summary API deployed successfully!"
    echo "\n📊 Service Information:"
    echo "   - Server: $SERVER_IP"
    echo "   - Port: $API_PORT"
    echo "   - Service Name: $API_NAME"
    echo "   - Directory: $REMOTE_DIR"
    echo "\n🌐 API Endpoints:"
    echo "   - Health Check: http://$SERVER_IP:$API_PORT/health"
    echo "   - Conversation Summary: http://$SERVER_IP:$API_PORT/api/conversation-summary"
    echo "   - All Conversations: http://$SERVER_IP:$API_PORT/api/conversations"
    echo "   - Specific Conversation: http://$SERVER_IP:$API_PORT/api/conversation/{id}"
    echo "\n🔧 Management Commands:"
    echo "   - Check status: ssh $SERVER_USER@$SERVER_IP 'pm2 status $API_NAME'"
    echo "   - View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs $API_NAME'"
    echo "   - Restart: ssh $SERVER_USER@$SERVER_IP 'pm2 restart $API_NAME'"
    echo "   - Stop: ssh $SERVER_USER@$SERVER_IP 'pm2 stop $API_NAME'"
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    
    check_server_connectivity
    check_ssh_connection
    create_remote_directory
    copy_files_to_server
    install_dependencies
    stop_existing_service
    start_service
    
    # Ask if user wants to configure Nginx
    read -p "🌐 Do you want to configure Nginx proxy? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        configure_nginx
    fi
    
    check_service_status
    show_deployment_summary
}

# Handle script arguments
case "${1:-}" in
    "test")
        echo "🧪 Testing deployment prerequisites..."
        check_server_connectivity
        check_ssh_connection
        echo "✅ All prerequisites met!"
        ;;
    "status")
        echo "📊 Checking service status..."
        ssh $SERVER_USER@$SERVER_IP "pm2 status $API_NAME"
        ;;
    "logs")
        echo "📋 Showing service logs..."
        ssh $SERVER_USER@$SERVER_IP "pm2 logs $API_NAME --lines 50"
        ;;
    "restart")
        echo "🔄 Restarting service..."
        ssh $SERVER_USER@$SERVER_IP "pm2 restart $API_NAME"
        ;;
    "stop")
        echo "🛑 Stopping service..."
        ssh $SERVER_USER@$SERVER_IP "pm2 stop $API_NAME"
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [test|status|logs|restart|stop]"
        echo "  test    - Test deployment prerequisites"
        echo "  status  - Check service status"
        echo "  logs    - Show service logs"
        echo "  restart - Restart the service"
        echo "  stop    - Stop the service"
        echo "  (no args) - Full deployment"
        exit 1
        ;;
esac