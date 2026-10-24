FROM node:20-alpine

WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev"]
