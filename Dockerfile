FROM node:alpine as builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn run build

FROM nginx:alpine

# Copy the static website files to the default Nginx serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx will start automatically