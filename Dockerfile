FROM node:carbon-alpine as bootstrap
WORKDIR /usr/local/app
COPY . .
RUN npm install