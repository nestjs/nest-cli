FROM node:carbon-alpine as production-dependencies
WORKDIR /nestjs/cli
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --production

FROM node:carbon-alpine as build-dependencies
WORKDIR /nestjs/cli
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

FROM node:carbon-alpine as tester
WORKDIR /nestjs/cli
COPY --from=build-dependencies /nestjs/cli/node_modules node_modules
COPY . .
RUN npm run -s test

FROM node:carbon-alpine as builder
WORKDIR /nestjs/cli
COPY --from=build-dependencies /nestjs/cli/node_modules node_modules
COPY . .
RUN npm run -s build

FROM node:carbon-alpine
RUN npm install -g yarn && \
  chmod 774 /usr/local/bin/yarnpkg /usr/local/bin/yarn
WORKDIR /nestjs/cli
COPY --from=production-dependencies /nestjs/cli .
COPY --from=builder /nestjs/cli/LICENSE LICENSE
COPY --from=builder /nestjs/cli/README.md README.md
COPY --from=builder /nestjs/cli/.npmignore .npmignore
COPY --from=builder /nestjs/cli/actions actions
COPY --from=builder /nestjs/cli/bin bin
COPY --from=builder /nestjs/cli/commands commands
COPY --from=builder /nestjs/cli/lib lib
RUN npm run build
RUN npm link
WORKDIR /workspace
EXPOSE 3000
VOLUME [ "/workspace" ]
CMD [ "/bin/sh" ]