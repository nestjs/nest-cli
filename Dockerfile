FROM node:carbon-alpine
RUN npm install -g yarn && \
    chmod 774 /usr/local/bin/yarnpkg /usr/local/bin/yarn
WORKDIR /nestjs/cli
COPY . .
RUN npm install --production && npm link
WORKDIR /workspace
EXPOSE 3000
VOLUME [ "/workspace" ]
CMD [ "/bin/sh" ]