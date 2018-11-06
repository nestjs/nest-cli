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
class GenerateCommand extends abstract_command_1.AbstractCommand {
    load(program) {
        program
            .command('generate <schematic> <name> [path]')
            .alias('g')
            .description('Generate a Nest element.')
            .option('--dry-run', 'Allow to test changes before command execution')
            .option('--flat', 'Enforce flat structure of generated element')
            .option('--no-spec', 'Disable spec files generation')
            .action((schematic, name, path, command) => __awaiter(this, void 0, void 0, function* () {
            const options = [];
            options.push({ name: 'dry-run', value: !!command.dryRun });
            options.push({ name: 'flat', value: command.flat });
            options.push({
                name: 'spec',
                value: command.spec,
            });
            const inputs = [];
            inputs.push({ name: 'schematic', value: schematic });
            inputs.push({ name: 'name', value: name });
            inputs.push({ name: 'path', value: path });
            yield this.action.handle(inputs, options);
        }));
    }
}
exports.GenerateCommand = GenerateCommand;
