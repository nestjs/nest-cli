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
const ora = require("ora");
const ui_1 = require("../ui");
class NestDependencyManager {
    constructor(packageManager) {
        this.packageManager = packageManager;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            const production = yield this.packageManager.getProduction();
            return production
                .filter(dependency => dependency.name.indexOf('@nestjs') > -1)
                .map(dependency => dependency.name);
        });
    }
    update(force, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const spinner = ora({
                spinner: {
                    interval: 120,
                    frames: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'],
                },
                text: ui_1.messages.PACKAGE_MANAGER_UPDATE_IN_PROGRESS,
            });
            spinner.start();
            const dependencies = yield this.read();
            if (force) {
                yield this.packageManager.upgradeProduction(dependencies, tag !== undefined ? tag : 'latest');
            }
            else {
                yield this.packageManager.updateProduction(dependencies);
            }
            spinner.succeed();
        });
    }
}
exports.NestDependencyManager = NestDependencyManager;
