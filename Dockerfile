FROM node:carbon-alpine
WORKDIR /bin/nestjs/cli
COPY . .
RUN npm install --production && npm link && \
    npm install -g yarn
WORKDIR /workspace
VOLUME [ "/workspace" ]
CMD [ "/bin/sh" ]