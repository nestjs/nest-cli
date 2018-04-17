Tool to manage NestJS projects: Modern, powerful web application framework for [Node.js](http://nodejs.org).

[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

# NestJS CLI

[![Join the chat at https://gitter.im/nestjs/nest-cli](https://badges.gitter.im/nestjs/nest-cli.svg)](https://gitter.im/nestjs/nest-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/nestjs/nest-cli.svg?branch=nest-v4)](https://travis-ci.org/nestjs/nest-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description
NestJS is a powerful web framework for [Node.js](http://nodejs.org), which helps you effortlessly build efficient, scalable applications. It uses modern JavaScript, is built with [TypeScript](http://www.typescriptlang.org) and combines best concepts of both OOP (Object Oriented Progamming) and FP (Functional Programming).
It is not just another framework. You do not have to wait for a large community, because NestJS is built with awesome, popular well-known libraries - [Express](https://github.com/expressjs/express) and [socket.io](https://github.com/socketio/socket.io)! It means, that you could quickly start using framework without worrying about a third party plugins.
The CLI tool helps to create, manage application architecture entities, build and run your project. 

## Installation
### NPM :

```$ npm install -g @nestjs/cli```

### Docker:
```$ docker pull nestjs/cli[:version]```

```$ docker run -it -rm -p 3000:3000 -v $(pwd)/workspace nestjs/cli[:version]```

### Git :
```$ git clone https://github.com/nestjs/nest-cli.git <project>```

```$ cd <project>```

With your Node runtime :
```$ npm install```

```$ npm link```

With Docker :

```$ docker build -t nestjs/cli .```

## Usage
See the [NestJS documentation](https://docs.nestjs.com/)
