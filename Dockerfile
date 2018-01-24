FROM node:carbon-alpine as bootstrap
ARG NPM_TOKEN
WORKDIR /usr/local/app
COPY . .
RUN npm install && echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}">>.npmrc

FROM node:carbon-alpine as tester
WORKDIR /usr/local/app
COPY --from=bootstrap /usr/local/app/ .
RUN npm test -s

FROM node:carbon-alpine as builder
WORKDIR /usr/local/app
COPY --from=bootstrap /usr/local/app .
RUN npm run -s build

FROM node:carbon-alpine as publisher
WORKDIR /usr/local/app
COPY --from=builder /usr/local/app .
ENTRYPOINT ["npm", "publish"]

