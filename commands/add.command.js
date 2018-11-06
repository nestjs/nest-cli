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
const abstract_command_1 = require("./abstract.command");
class AddCommand extends abstract_command_1.AbstractCommand {
    load(program) {
        program
            .command('add <library>')
            .description('Allow user to add a library')
            .action((library) => __awaiter(this, void 0, void 0, function* () {
            const inputs = [];
            inputs.push({ name: 'library', value: library });
            yield this.action.handle(inputs);
        }));
    }
}
exports.AddCommand = AddCommand;
