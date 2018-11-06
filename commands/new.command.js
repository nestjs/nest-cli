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
class NewCommand extends abstract_command_1.AbstractCommand {
    load(program) {
        program
            .command('new [name] [description] [version] [author]')
            .alias('n')
            .description('Generate a new Nest application.')
            .option('-d, --dry-run', 'Allow to test changes before execute command.')
            .option('-s, --skip-install', 'Allow to skip package installation.')
            .option('-p, --package-manager [package-manager]', 'Allow to specify package manager to skip package-manager selection.')
            .option('-l, --language [language]', 'Specify ts or js language to use')
            .action((name, description, version, author, command) => __awaiter(this, void 0, void 0, function* () {
            const options = [];
            options.push({ name: 'dry-run', value: !!command.dryRun });
            options.push({ name: 'skip-install', value: !!command.skipInstall });
            options.push({ name: 'package-manager', value: command.packageManager });
            options.push({ name: 'language', value: !!command.language ? command.language : 'ts' });
            const inputs = [];
            inputs.push({ name: 'name', value: name });
            inputs.push({ name: 'description', value: description });
            inputs.push({ name: 'version', value: version });
            inputs.push({ name: 'author', value: author });
            yield this.action.handle(inputs, options);
        }));
    }
}
exports.NewCommand = NewCommand;
