FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm i

# Copy the rest of the application
COPY . .

# Build the application
ENV NODE_OPTIONS=--max_old_space_size=16384
RUN pnpm run build

# Default to serving the build directory
CMD ["npx", "serve", "build"]

