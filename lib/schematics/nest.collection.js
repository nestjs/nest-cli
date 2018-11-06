"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_collection_1 = require("./abstract.collection");
class NestCollection extends abstract_collection_1.AbstractCollection {
    constructor(runner) {
        super('@nestjs/schematics', runner);
        this.schematics = [
            { name: 'application', alias: 'app' },
            { name: 'class', alias: 'cl' },
            { name: 'configuration', alias: 'config' },
            { name: 'controller', alias: 'co' },
            { name: 'decorator', alias: 'd' },
            { name: 'filter', alias: 'f' },
            { name: 'gateway', alias: 'ga' },
            { name: 'guard', alias: 'gu' },
            { name: 'interceptor', alias: 'i' },
            { name: 'middleware', alias: 'mi' },
            { name: 'module', alias: 'mo' },
            { name: 'pipe', alias: 'pi' },
            { name: 'provider', alias: 'pr' },
            { name: 'service', alias: 's' },
            { name: 'library', alias: 'lib' },
        ];
    }
    execute(name, options) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const schematic = this.validate(name);
            yield _super("execute").call(this, schematic, options);
        });
    }
    validate(name) {
        const schematic = this.schematics.find(s => s.name === name || s.alias === name);
        if (schematic === undefined || schematic === null) {
            throw new Error(`Invalid schematic ${name}`);
        }
        return schematic.name;
    }
}
exports.NestCollection = NestCollection;
