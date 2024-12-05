# Use Node.js LTS version
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install
RUN node -v && npm -v
# Copy app source code
COPY . .

# Build TypeScript
RUN npm run build 

# Expose port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]
