[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

**WARNING: The CLI is still a work in progress and is not ready for practical use. The repository is created to allow for insight and contributions.**

# Nest CLI

[![Join the chat at https://gitter.im/nestjs/nest-cli](https://badges.gitter.im/nestjs/nest-cli.svg)](https://gitter.im/nestjs/nest-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ThomRick/nest-cli.svg?branch=develop)](https://travis-ci.org/ThomRick/nest-cli)
[![Known Vulnerabilities](https://snyk.io/test/github/thomrick/nest-cli/badge.svg)](https://snyk.io/test/github/thomrick/nest-cli)
[![Coverage Status](https://coveralls.io/repos/github/ThomRick/nest-cli/badge.svg?branch=develop)](https://coveralls.io/github/ThomRick/nest-cli?branch=develop)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
## Installation
### Git :
```
$ git clone https://github.com/nestjs/nest-cli.git <project>
$ cd <project>
$ npm install
$ npm link
```

###npm (not registered)

## nestconfig.json (not implemented)
While the CLI does not require a nestconfig.json file to work, default values can be overrided by implementing one. Currently, a nestconfig.json file is only the following:
```json
{
    "language": "ts | es (default: ts)"
}
```

## Commands
### new
Examples : 
   * `$ nest new my-app`
   * `$ nest new my-app myapp/`
   * `$ nest new my-app --repo https://github.com/ThomRick/nest-typescript-starter`
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
@Module({})
export class NameModule {}
```

#### controller
Examples : 
   * `$ nest generate controller path/to/<name>` 
   * `$ nest g controller path/to/<name>`
Creates a templated controller files : 
   * `src/path/to/<name>/<name>.controller.ts`
```typescript
@Controller()
export class NameController {
    public constructor() {}
}
```
   * `src/path/to/<name>/<name>.controller.spec.ts`
```typescript
import {NameController} from './name.controller';
import {expect} from 'chai';

describe('NameController', () => {
    const controller: NameController;

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
}
```

#### component
Examples : 
   * `$ nest generate component path/to/<name>` 
   * `$ nest g component path/to/<name>`
Creates a templated component files :
   * `src/path/to/<name>/<name>.service.ts`
```typescript
@Component()
export class NameService {
    constructor() {}
}
```
   * `src/path/to/<name>/<name>.service.spec.ts`
```typescript
import {NameService} from './name.service';
import {expect} from 'chai';

describe('NameService', () => {
    const service: NameService;

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
}
```

### serve (not implemented)
### build (not implemented)