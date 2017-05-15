[![Nest Logo](http://kamilmysliwiec.com/public/nest-logo.png)](http://kamilmysliwiec.com/)

**WARNING: The CLI is still a work in progress and is not ready for practical use. The repository is created to allow for insight and contributions.**

# Nest CLI

## nestconfig.json

While the CLI does not require a nestconfig.json file to work, default values can be overrided by implementing one. Currently, a nestconfig.json file is only the following:

```
{
    language: "ts" | "es" // default: "ts"
}
```

## Commands

### new
Example: `nest new my-app`, `nest new my-app myapp/`, `nest new my-app --repo https://github.com/KerryRitter/nest-typescript-starter`

Creates a new Nest application by cloning a given Git repository.

### generate (or `g`)

#### module
Example: `nest g module users` or `nest g module users modules/users/users.module.ts`

Creates a templated module file. If no path is entered, it creates a {name}.module.{ext} file in the working directory.

```
import { Module } from 'nest.js';

@Module({
    components: [],
    controllers: []
})
export class ValuesModule {
}
```

#### controller
Example: `nest g controller users` or `nest g module users modules/users/users.controller.ts`

Creates a templated controller file. If no path is entered, it creates a {name}.controller.{ext} file in the working directory.

```
import * as express from 'express';
import { Controller, Response, Body, Param, Get, Post, HttpStatus } from 'nest.js';

@Controller('values')
export class ValuesController {
    private _values = [1, 2, 3];

    public constructor() {}

    @Get()
    public async getAll(@Response() res: express.Response) {
        res.status(HttpStatus.OK).json(this._values);
    }

    @Get('/:id')
    public async get(@Response() res: express.Response, @Param('id') id) {
        const val = this._values[parseInt(id, 10)];

        if (val) {
            res.status(HttpStatus.OK).json(val);
        } else {
            res.status(HttpStatus.NOT_FOUND);
        }
    }
}
```

#### component
Example: `nest g component users` or `nest g module users modules/users/users.component.ts`

Creates a templated controller file. If no path is entered, it creates a {name}.component.{ext} file in the working directory.

```
import { Component } from 'nest.js';

@Component()
export class ValuesService {
    public getAll() {
        return [1, 2, 3, 4];
    }

    public get(id: number) {
        return id;
    }
}
```