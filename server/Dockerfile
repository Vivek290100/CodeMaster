# Dockerfile for server

# Step 1: Use an official Node.js image
FROM node:18

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the backend files
COPY . .

# Step 5: Expose the port that the server will run on
EXPOSE 5000

# Step 6: Run the server
CMD ["npm", "start"]
