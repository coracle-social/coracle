FROM node:alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm --verbose ci

COPY . .

RUN npm run build

FROM nginx:alpine

# Copy the static website files to the default Nginx serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx will start automatically