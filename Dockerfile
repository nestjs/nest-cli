FROM node:carbon-alpine as bootstrap
WORKDIR /usr/local/app
COPY . .
RUN npm install

FROM node:carbon-alpine as tester
WORKDIR /usr/local/app
COPY --from=bootstrap /usr/local/app/ .
RUN npm test -s

FROM node:carbon-alpine as builder
WORKDIR /usr/local/app
COPY --from=bootstrap /usr/local/app .
RUN npm run -s build

