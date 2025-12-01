# Stage 1: Build the React application using Node
FROM node:20-alpine AS build

# Create and set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY front/package.json front/package-lock.json ./front/
RUN cd front && npm install

# Copy application source code
COPY front/ ./front/

# Build the project (output to front/dist)
# NOTE: The host's build script is used to generate the static files.
# We will use this file as a base image for the builder service in compose.