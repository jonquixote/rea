# Use an official Node.js runtime as a parent image
# Choose a version compatible with your project (e.g., LTS version)
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code
# Note: This includes both frontend and backend directories
COPY . .

# If your frontend needs a separate build step:
# WORKDIR /usr/src/app/frontend
# RUN npm install
# RUN npm run build
# WORKDIR /usr/src/app

# If your backend needs a build step (e.g., TypeScript compilation), add it here:
# RUN npm run build:backend # Assuming you have such a script

# Expose the port the backend server runs on (check backend/server.js if unsure)
# Defaulting to 8000, adjust if necessary
EXPOSE 8000

# Define the command to run the application (adjust if your start script is different)
CMD [ "node", "backend/server.js" ]
