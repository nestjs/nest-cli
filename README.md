Tool to manage Nest projects: Modern, powerful web application framework for [Node.js](http://nodejs.org).

[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

# Nest CLI

[![Join the chat at https://gitter.im/nestjs/nest-cli](https://badges.gitter.im/nestjs/nest-cli.svg)](https://gitter.im/nestjs/nest-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ThomRick/nest-cli.svg?branch=master)](https://travis-ci.org/ThomRick/nest-cli)
[![Known Vulnerabilities](https://snyk.io/test/github/thomrick/nest-cli/badge.svg)](https://snyk.io/test/github/thomrick/nest-cli)
[![Coverage Status](https://coveralls.io/repos/github/ThomRick/nest-cli/badge.svg?branch=master)](https://coveralls.io/github/ThomRick/nest-cli?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

Nest is a powerful web framework for [Node.js](http://nodejs.org), which helps you effortlessly build efficient, scalable applications. It uses modern JavaScript, is built with [TypeScript](http://www.typescriptlang.org) and combines best concepts of both OOP (Object Oriented Progamming) and FP (Functional Programming).

It is not just another framework. You do not have to wait for a large community, because Nest is built with awesome, popular well-known libraries - [Express](https://github.com/expressjs/express) and [socket.io](https://github.com/socketio/socket.io)! It means, that you could quickly start using framework without worrying about a third party plugins.

The CLI tool helps to create, manage application architecture entities, build and run your project. 

## Installation
### Git :
```
$ git clone https://github.com/nestjs/nest-cli.git <project>
$ cd <project>
$ npm install
$ npm link
```

### npm :

```npm install -g @nestjs/cli```

## nestconfig.json
The nestconfig.json is here to manage the CLI execution like asset generation.
```json
{
    "language": "ts | es (default: ts)",
    "entryFile": "src/main.ts"
}
```

## Commands
### new
Usage :
   `$ nest new <name> [destination] --<repository>`
    
Examples : 
   * `$ nest new my-app`
   * `$ nest new my-app myapp/`
   * `$ nest new my-app --repository https://github.com/ThomRick/nest-typescript-starter`
   * `$ nest new my-app --r https://github.com/ThomRick/nest-typescript-starter`
   * `$ nest new my-app myapp --r https://github.com/ThomRick/nest-typescript-starter`

Creates a new Nest application by cloning `https://github.com/nestjs/nest-typescript-starter` Git repository.
It add default nestconfig.json file if it does not exist.

### generate (or `g`)
Usage :
    `$ nest generate <type> <name>`

Examples :
   * `$ nest g module cats`

It creates the asset name folder and put the asset contents from template.

Managed assets :
   * module
   * controller
   * component / service
   * middleware
   * pipe
   * gateway
     
### serve (or `s`)
Usage :  
   * `$ nest serve`

It runs a live reload development server. 

### build (not implemented)

### info
Usage:
   * `$ nest info`

It prints the current OS and installed nest information

### update 
Usage : 
   * `$ nest update`  

It updates :
   * @nestjs dependencies
   * devDependencies
   
## Road Map
https://trello.com/nestcli
