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
const fs = require("fs");
class FileSystemReader {
    constructor(directory) {
        this.directory = directory;
    }
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.readdir(this.directory, (error, filenames) => {
                    if (!!error) {
                        reject(error);
                    }
                    else {
                        resolve(filenames);
                    }
                });
            });
        });
    }
    read(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.readFile(`${this.directory}/${name}`, (error, data) => {
                    if (!!error) {
                        reject(error);
                    }
                    else {
                        resolve(data.toString());
                    }
                });
            });
        });
    }
    readAnyOf(filenames) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (const file of filenames) {
                    return yield this.read(file);
                }
            }
            catch (err) {
                return filenames.length > 0
                    ? yield this.readAnyOf(filenames.slice(1, filenames.length))
                    : undefined;
            }
        });
    }
}
exports.FileSystemReader = FileSystemReader;
