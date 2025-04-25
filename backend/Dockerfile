# Using Node.js 18 as the base image
FROM node:18

# Setting the working directory inside the container, to run all subsequent commands from here
WORKDIR /app

# To install all dependencies defined
COPY package*.json ./
RUN npm install

# To copy rest of the application code
COPY . .

# Exposing the backend port
EXPOSE 5001

# Command that runs when the container starts
CMD ["node", "server.js"]
