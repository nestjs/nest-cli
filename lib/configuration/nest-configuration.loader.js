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
const defaults_1 = require("./defaults");
class NestConfigurationLoader {
    constructor(reader) {
        this.reader = reader;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield this.reader.readAnyOf([
                '.nestcli.json',
                '.nest-cli.json',
                'nest-cli.json',
                'nest.json',
            ]);
            return content ? JSON.parse(content) : defaults_1.defaultConfiguration;
        });
    }
}
exports.NestConfigurationLoader = NestConfigurationLoader;
