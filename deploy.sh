#!/bin/bash

# Real Estate Investment App Deployment Script

echo "Starting deployment of Real Estate Investment App..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
PORT=5000
MONGO_URI=mongodb://localhost:27017/real-estate-app
POSTGRES_URI=postgres://postgres:postgres@localhost:5432/real-estate-app
GOOGLE_AI_API_KEY=your_google_ai_api_key
EOF
  echo ".env file created. Please update with your actual credentials."
else
  echo ".env file already exists."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deployment directory
echo "Creating deployment directory..."
mkdir -p deployment

# Copy necessary files
echo "Copying files to deployment directory..."
cp -r backend deployment/
cp -r frontend/build deployment/public
cp package.json deployment/
cp .env deployment/
cp DEPLOYMENT.md deployment/

# Create start script
echo "Creating start script..."
cat > deployment/start.sh << EOF
#!/bin/bash
cd \$(dirname \$0)
npm install --production
node backend/server.js
EOF
chmod +x deployment/start.sh

echo "Deployment package created in ./deployment directory"
echo "To deploy, copy the deployment directory to your server and run ./start.sh"

# Option to deploy to static hosting
if [ "$1" == "--deploy-static" ]; then
  echo "Deploying frontend to static hosting..."
  # This would be replaced with actual deployment commands
  # For example: aws s3 sync frontend/build s3://your-bucket-name/
  echo "Static deployment completed!"
fi

# Option to deploy full stack
if [ "$1" == "--deploy-full" ]; then
  echo "Deploying full stack application..."
  # This would be replaced with actual deployment commands
  # For example: docker-compose up -d
  echo "Full stack deployment completed!"
fi

echo "Deployment preparation completed successfully!"
