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
class UpdateCommand extends abstract_command_1.AbstractCommand {
    load(program) {
        program
            .command('update')
            .alias('u')
            .description('Update @nestjs dependencies.')
            .option('-f, --force', 'Call for upgrading instead of updating.')
            .option('-t, --tag <tag>', 'Call for upgrading to latest | beta | rc | next tag.')
            .action((command) => __awaiter(this, void 0, void 0, function* () {
            const options = [];
            options.push({ name: 'force', value: !!command.force });
            options.push({ name: 'tag', value: command.tag });
            yield this.action.handle([], options);
        }));
    }
}
exports.UpdateCommand = UpdateCommand;
