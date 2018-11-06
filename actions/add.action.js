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
const package_managers_1 = require("../lib/package-managers");
const abstract_action_1 = require("./abstract.action");
class AddAction extends abstract_action_1.AbstractAction {
    handle(inputs) {
        return __awaiter(this, void 0, void 0, function* () {
            const manager = yield package_managers_1.PackageManagerFactory.find();
            const libraryInput = inputs.find(input => input.name === 'library');
            if (libraryInput) {
                const library = libraryInput.value;
                yield manager.addProduction([library], 'latest');
            }
        });
    }
}
exports.AddAction = AddAction;
