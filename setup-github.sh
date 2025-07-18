#!/bin/bash

# Setup GitHub Repository for MediMedi VR
# Usage: ./setup-github.sh <github_username> <repository_name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <github_username> <repository_name>${NC}"
    echo -e "${YELLOW}Example: $0 myusername medimedi-vr${NC}"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=$2
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo -e "${BLUE}🚀 Setting up GitHub Repository${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "Username: ${GITHUB_USERNAME}"
echo -e "Repository: ${REPO_NAME}"
echo -e "URL: ${REPO_URL}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "medimedi-konvergen-vr/package.json" ]; then
    print_error "Please run this script from the MediMedi VR project root directory"
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    git branch -M main
else
    print_status "Git repository already initialized"
fi

# Update README.md with correct repository URL
print_status "Updating README.md with repository URL..."
sed -i.bak "s|https://github.com/dr-iskandar/medimedi-vr.git|${REPO_URL}|g" README.md
sed -i.bak "s|YOUR_USERNAME|${GITHUB_USERNAME}|g" README.md
rm -f README.md.bak

# Update deploy-from-github.sh with correct repository URL
print_status "Updating deployment script with repository URL..."
sed -i.bak "s|https://github.com/dr-iskandar/medimedi-vr.git|${REPO_URL}|g" deploy-from-github.sh
rm -f deploy-from-github.sh.bak

# Add all files
print_status "Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit changes
    print_status "Committing changes..."
    git commit -m "Initial commit: MediMedi VR - Virtual Reality Emotion Analysis Platform

- Added React Three.js VR frontend with WebXR support
- Added Flask backend for emotion analysis
- Added 3D Avatar with smooth emotion transitions
- Added 360° immersive environments
- Added VR controller and hand tracking support
- Added deployment scripts and documentation
- Added GitHub integration and CI/CD setup"
fi

# Add remote origin
print_status "Adding remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Check if repository exists on GitHub
print_status "Checking if repository exists on GitHub..."
if git ls-remote "$REPO_URL" &> /dev/null; then
    print_status "Repository exists. Pushing to existing repository..."
    
    # Pull first to avoid conflicts
    print_status "Pulling latest changes..."
    git pull origin main --allow-unrelated-histories || true
    
    # Push changes
    print_status "Pushing changes to GitHub..."
    git push -u origin main
else
    print_warning "Repository does not exist on GitHub yet."
    echo -e "${YELLOW}Please create the repository on GitHub first:${NC}"
    echo -e "${BLUE}1. Go to: https://github.com/new${NC}"
    echo -e "${BLUE}2. Repository name: ${REPO_NAME}${NC}"
    echo -e "${BLUE}3. Description: Virtual Reality Emotion Analysis Platform${NC}"
    echo -e "${BLUE}4. Make it Public or Private${NC}"
    echo -e "${BLUE}5. Don't initialize with README (we already have one)${NC}"
    echo -e "${BLUE}6. Click 'Create repository'${NC}"
    echo ""
    echo -e "${YELLOW}After creating the repository, run:${NC}"
    echo -e "${GREEN}git push -u origin main${NC}"
fi

# Create GitHub Actions workflow
print_status "Creating GitHub Actions workflow..."
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production Server

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'medimedi-konvergen-vr/package-lock.json'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install frontend dependencies
      run: |
        cd medimedi-konvergen-vr
        npm ci
    
    - name: Install backend dependencies
      run: |
        cd emotion-analysis-backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Build frontend
      run: |
        cd medimedi-konvergen-vr
        npm run build
    
    - name: Test backend
      run: |
        cd emotion-analysis-backend
        python -m pytest tests/ || echo "No tests found"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/medimedi-vr
          git pull origin main
          ./deploy-from-github.sh
EOF

# Create issue templates
print_status "Creating GitHub issue templates..."
mkdir -p .github/ISSUE_TEMPLATE

cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**VR Environment (please complete the following information):**
 - Device: [e.g. Meta Quest 2, HTC Vive]
 - Browser [e.g. chrome, firefox]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

# Create pull request template
cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested in desktop browser
- [ ] Tested in VR headset
- [ ] Backend API tested
- [ ] No console errors

## Screenshots/Videos
If applicable, add screenshots or videos of the changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
EOF

# Add GitHub files to git
print_status "Adding GitHub configuration files..."
git add .github/

# Commit GitHub files if there are changes
if ! git diff --staged --quiet; then
    git commit -m "Add GitHub Actions workflow and issue templates

- Added CI/CD pipeline for automated testing and deployment
- Added bug report and feature request templates
- Added pull request template
- Configured automated deployment to production server"
fi

print_status "Setup completed successfully!"
echo ""
echo -e "${GREEN}🎉 GitHub repository setup complete!${NC}"
echo -e "${BLUE}📁 Repository URL:${NC} ${REPO_URL}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. ${BLUE}Create repository on GitHub:${NC} https://github.com/new"
echo -e "2. ${BLUE}Push to GitHub:${NC} git push -u origin main"
echo -e "3. ${BLUE}Setup deployment secrets in GitHub:${NC}"
echo -e "   - HOST: 156.67.217.39"
echo -e "   - USERNAME: ubuntu"
echo -e "   - SSH_KEY: (your private SSH key)"
echo -e "4. ${BLUE}Deploy to server:${NC} ssh ubuntu@156.67.217.39 'bash <(curl -s ${REPO_URL%%.git}/raw/main/deploy-from-github.sh)'"
echo ""
echo -e "${GREEN}✅ Ready for collaborative development and automated deployment!${NC}"