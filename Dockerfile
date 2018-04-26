FROM node:carbon-alpine as builder
WORKDIR /nestjs/cli
COPY . .
RUN npm install && npm run -s build && ls

FROM node:carbon-alpine
RUN npm install -g yarn && \
    chmod 774 /usr/local/bin/yarnpkg /usr/local/bin/yarn
WORKDIR /nestjs/cli
COPY --from=builder /nestjs/cli/package.json package.json
COPY --from=builder /nestjs/cli/package-lock.json package-lock.json
COPY --from=builder /nestjs/cli/LICENSE LICENSE
COPY --from=builder /nestjs/cli/README.md README.md
COPY --from=builder /nestjs/cli/actions actions
COPY --from=builder /nestjs/cli/bin bin
COPY --from=builder /nestjs/cli/commands commands
COPY --from=builder /nestjs/cli/lib lib
RUN ls && npm install --production && npm link
WORKDIR /workspace
EXPOSE 3000
VOLUME [ "/workspace" ]
CMD [ "/bin/sh" ]