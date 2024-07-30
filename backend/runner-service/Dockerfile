FROM node:20

# Set the working directory in the container
WORKDIR /code

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Directory  path
ENV COPY_DIRECTORY_PATH=../workspace

# Install any dependencies
RUN npm install

# Copy application code
COPY . .

# Build the app
RUN npm run build

# Port to exposed
EXPOSE 3000

# Command to run at end
CMD [ "node", "dist/index.js" ]