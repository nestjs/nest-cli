FROM node:carbon-alpine as dependencies
WORKDIR /workspace
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --production

FROM nestjs/cli:develop
WORKDIR /tests
COPY --from=dependencies /workspace .
COPY . .
CMD npm start -s
