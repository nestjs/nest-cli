FROM node:carbon-alpine
RUN npm install -g yarn
WORKDIR /bin/nestjs/cli
COPY . .
RUN npm install --production && npm link
WORKDIR /workspace
VOLUME [ "/workspace" ]
CMD [ "/bin/sh" ]