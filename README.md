Tool to manage Nest projects: Modern, powerful web application framework for [Node.js](http://nodejs.org).

[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

# Nest CLI

[![Join the chat at https://gitter.im/nestjs/nest-cli](https://badges.gitter.im/nestjs/nest-cli.svg)](https://gitter.im/nestjs/nest-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ThomRick/nest-cli.svg?branch=develop)](https://travis-ci.org/ThomRick/nest-cli)
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
Examples : 
   * `$ nest new my-app`
   * `$ nest new my-app myapp/`
   * `$ nest new my-app --repository https://github.com/ThomRick/nest-typescript-starter`

Creates a new Nest application by cloning `https://github.com/ThomRick/nest-typescript-starter` Git repository.

### generate (or `g`)

#### module
Examples :
   * `$ nest generate module <assetName>` OR `$ nest g module <assetName>`
   * `$ nest g module <assetName> [moduleName]`
   * `$ nest g module <assetName> [moduleName1/moduleName2/moduleName3]`
- Creates a templated module file :
   * `src/app/modules/<assetName>/<assetName>.module.ts`
   * `src/app/modules/[moduleName]/modules/<assetName>/<assetName>.module.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/modules/<assetName>/<assetName>.module.ts` 
```typescript
import {Module} from '@nestjs/common';

@Module({})
export class NameModule {}
```

#### controller
Examples : 
   * `$ nest generate controller <assetName>` OR `$ nest g controller <assetName>` 
   * `$ nest g controller <assetName> [moduleName]`
   * `$ nest g controller <assetName> [moduleName1/moduleName2/moduleName3]`

Creates a templated controller files : 
   * `src/app/controllers/<assetName>.controller.ts`
   * `src/app/modules/[moduleName]/modules/controllers/<assetName>.controller.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/controllers/<assetName>.controller.ts`
```typescript
import {Controller} from '@nestjs/common';

@Controller()
export class NameController {
    constructor() {}
}

```
   * `src/app/controllers/<assetName>.controller.spec.ts`
   * `src/app/modules/[moduleName]/modules/controllers/<assetName>.controller.spec.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/controllers/<assetName>.controller.spec.ts`
```typescript
import {Test} from '@nestjs/testing';
import {NameController} from './name.controller';
import {expect} from 'chai';

describe('NameController', () => {
    let controller: NameController;

    beforeEach(() => {
        Test.createTestingModule({
            controllers: [
                NameController
            ]
        });

        controller = Test.get(NameController);
    });

    it('should exists', () => {
        expect(controller).to.exist;
    });
});
```
Provides the controller in the specified `[moduleName]`
```typescript
import {Module} from '@nestjs/common';
import {NameController} from './controllers/name.controller';

@Module({
  controllers: [
    NameController
  ]
})
export class ModuleNameModule {}
```

#### component
Examples : 
   * `$ nest generate component <assetName>` OR `$ nest g component <assetName>` 
   * `$ nest g component <assetName> [moduleName]`
   * `$ nest g component <assetName> [moduleName1/moduleName2/moduleName3]`

Creates a templated component files :
   * `src/app/services/<assetName>.service.ts`
   * `src/app/modules/[moduleName]/modules/services/<assetName>.service.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/services/<assetName>.service.ts`
```typescript
import {Component} from '@nestjs/common';

@Component()
export class NameService {
    constructor() {}
}
```
   * `src/app/services/<assetName>.service.spec.ts`
   * `src/app/modules/[moduleName]/modules/services/<assetName>.service.spec.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/services/<assetName>.service.spec.ts`
```typescript
import {Test} from '@nestjs/testing';
import {NameService} from './name.service';
import {expect} from 'chai';

describe('NameService', () => {
    let service: NameService;

    beforeEach(() => {
        Test.createTestingModule({
            components: [
                NameService
            ]
        });

        service = Test.get(NameService);
    });

    it('should exists', () => {
        expect(service).to.exist;
    });
});
```
Provides the component in the specified `[moduleName]`
```typescript
import {Module} from '@nestjs/common';
import {NameService} from './services/name.service';

@Module({
  components: [
    NameService
  ]
})
export class ModuleNameModule {}
```

#### pipe
Examples : 
   * `$ nest generate pipe <assetName>` OR `$ nest g pipe <assetName>` 
   * `$ nest g pipe <assetName> [moduleName]`
   * `$ nest g pipe <assetName> [moduleName1/moduleName2/moduleName3]`

Creates a templated pipe files :
   * `src/app/pipes/<assetName>.service.ts`
   * `src/app/modules/[moduleName]/modules/pipes/<assetName>.pipe.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/pipes/<assetName>.pipe.ts`
```typescript
import { PipeTransform, Pipe, ArgumentMetadata } from '@nestjs/common';

@Pipe()
export class NamePipe implements PipeTransform {
    public transform(value, metadata: ArgumentMetadata) {
        return value;
    }
}
```

#### middleware
Examples : 
   * `$ nest generate middleware <assetName>` OR `$ nest g middleware <assetName>` 
   * `$ nest g middleware <assetName> [moduleName]`
   * `$ nest g middleware <assetName> [moduleName1/moduleName2/moduleName3]`

Creates a templated middleware files :
   * `src/app/middlewares/<assetName>.service.ts`
   * `src/app/modules/[moduleName]/modules/middlewares/<assetName>.middleware.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/middlewares/<assetName>.middleware.ts`
```typescript
import { Middleware, NestMiddleware } from '@nestjs/common';

@Middleware()
export class NameMiddleware implements NestMiddleware {
    resolve(): (req, res, next) => void {
        return (req, res, next) => {
            next();
        }
    }
}
```

#### gateway
Examples : 
   * `$ nest generate gateway <assetName>` OR `$ nest g gateway <assetName>` 
   * `$ nest g gateway <assetName> [moduleName]`
   * `$ nest g gateway <assetName> [moduleName1/moduleName2/moduleName3]`

Creates a templated middleware files :
   * `src/app/gateways/<assetName>.gateway.ts`
   * `src/app/modules/[moduleName]/modules/gateways/<assetName>.gateway.ts`
   * `src/app/modules/[moduleName1]>/modules/[moduleName2]>/modules/[moduleName3]>/gateways/<assetName>.gateway.ts`
```typescript
import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class NameGateway {}
```
Provides the gateway in the specified `[moduleName]`
```typescript
import {Module} from '@nestjs/common';
import {NameGateway} from './gateways/name.gateway';

@Module({
  components: [
    NameGateway
  ]
})
export class ModuleNameModule {}
```

### serve  
 Example :  
   * `$ nest serve`  
   * `$ nest s`  

Used to run a live reloading development server.

### build (not implemented)

### update 
Examples : 
   * `$ nest update`  

Used to update project :
   * @nestjs dependencies
   * devDependencies
   
## Road Map
https://trello.com/nestcli
