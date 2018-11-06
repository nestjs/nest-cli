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
const chalk_1 = require("chalk");
const dependency_managers_1 = require("../lib/dependency-managers");
const package_managers_1 = require("../lib/package-managers");
const abstract_action_1 = require("./abstract.action");
class UpdateAction extends abstract_action_1.AbstractAction {
    handle(inputs, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const force = options.find((option) => option.name === 'force');
            const tag = options.find((option) => option.name === 'tag');
            if (force.value && tag.value === undefined) {
                console.error(chalk_1.default.red('You should specify a tag when force update.'));
            }
            else {
                const manager = new dependency_managers_1.NestDependencyManager(yield package_managers_1.PackageManagerFactory.find());
                yield manager.update(force.value, tag.value);
            }
        });
    }
}
exports.UpdateAction = UpdateAction;
