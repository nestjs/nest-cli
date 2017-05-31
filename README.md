[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

**WARNING: The CLI is still a work in progress and is not ready for practical use. The repository is created to allow for insight and contributions.**

# Nest CLI

[![Join the chat at https://gitter.im/nestjs/nest-cli](https://badges.gitter.im/nestjs/nest-cli.svg)](https://gitter.im/nestjs/nest-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/ThomRick/nest-cli.svg?branch=develop)](https://travis-ci.org/ThomRick/nest-cli)
[![Coverage Status](https://coveralls.io/repos/github/ThomRick/nest-cli/badge.svg?branch=develop)](https://coveralls.io/github/ThomRick/nest-cli?branch=develop)

## Installation

### Git :
```
$ git clone https://github.com/nestjs/nest-cli.git <project>
$ cd <project>
$ npm install
$ npm link
```

## nestconfig.json (not implemented)

While the CLI does not require a nestconfig.json file to work, default values can be overrided by implementing one. Currently, a nestconfig.json file is only the following:

```json
{
    "language": "ts | es"  // default: "ts"
}
```

## Commands

### create (not implemented)
Example: `nest new my-app`, `nest new my-app myapp/`, `nest new my-app --repo https://github.com/KerryRitter/nest-typescript-starter`

Creates a new Nest application by cloning a given Git repository.

### generate (or `g`)

#### module
Example :
`nest generate module path/to/<name>`
 OR
`nest g module path/to/<name>`

Creates a templated module file :
`src/path/to/<name>/<name>.module.ts`

```typescript
@Module({})
export class NameModule {}
```

#### controller
Example: 
`nest generate controller path/to/<name>` 
OR
`nest g controller path/to/<name>`

Creates a templated controller files : 
`src/path/to/<name>/<name>.controller.ts`

```typescript
@Controller()
export class NameController {
    public constructor() {}
}
```

`src/path/to/<name>/<name>.controller.spec.ts`

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
Example: 
`nest generate component path/to/<name>` 
OR
`nest g component path/to/<name>`

Creates a templated component files :
`src/path/to/<name>/<name>.service.ts`

```typescript
@Component()
export class NameService {
    constructor() {}
}
```

`src/path/to/<name>/<name>.service.spec.ts`
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