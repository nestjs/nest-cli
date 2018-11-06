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
const strings_1 = require("@angular-devkit/core/src/utils/strings");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const inquirer = require("inquirer");
const package_managers_1 = require("../lib/package-managers");
const questions_1 = require("../lib/questions/questions");
const schematics_1 = require("../lib/schematics");
const ui_1 = require("../lib/ui");
const abstract_action_1 = require("./abstract.action");
class NewAction extends abstract_action_1.AbstractAction {
    handle(inputs, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const questions = generateQuestionsForMissingInputs(inputs);
            const answers = yield askForMissingInformation(questions);
            const args = replaceInputMissingInformation(inputs, answers);
            yield generateApplicationFiles(inputs, options);
            const shouldSkipInstall = options.some((option) => option.name === 'skip-install' && option.value === true);
            if (!shouldSkipInstall) {
                yield installPackages(inputs, options);
            }
            printCollective();
        });
    }
}
exports.NewAction = NewAction;
const generateQuestionsForMissingInputs = (inputs) => {
    return inputs
        .map((input) => questions_1.generateInput(input.name)(input.value)(generateDefaultAnswer(input.name)))
        .filter((question) => question !== undefined);
};
const generateDefaultAnswer = (name) => {
    switch (name) {
        case 'name':
            return 'nestjs-app-name';
        case 'description':
            return 'description';
        case 'version':
            return '0.0.0';
        case 'author':
        default:
            return '';
    }
};
const askForMissingInformation = (questions) => __awaiter(this, void 0, void 0, function* () {
    console.info();
    console.info(ui_1.messages.PROJECT_INFORMATION_START);
    console.info(ui_1.messages.ADDITIONAL_INFORMATION);
    console.info();
    const prompt = inquirer.createPromptModule();
    const answers = yield prompt(questions);
    console.info();
    console.info(ui_1.messages.PROJECT_INFORMATION_COLLECTED);
    console.info();
    return answers;
});
const replaceInputMissingInformation = (inputs, answers) => {
    return inputs.map((input) => (input.value =
        input.value !== undefined ? input.value : answers[input.name]));
};
const generateApplicationFiles = (args, options) => __awaiter(this, void 0, void 0, function* () {
    const collection = schematics_1.CollectionFactory.create(schematics_1.Collection.NESTJS);
    const schematicOptions = mapSchematicOptions(args.concat(options));
    yield collection.execute('application', schematicOptions);
    yield generateConfigurationFile(args, options, collection);
    console.info();
});
const mapSchematicOptions = (options) => {
    return options.reduce((schematicOptions, option) => {
        if (option.name !== 'skip-install' &&
            option.value !== 'package-manager') {
            schematicOptions.push(new schematics_1.SchematicOption(option.name, option.value));
        }
        return schematicOptions;
    }, []);
};
const generateConfigurationFile = (args, options, collection) => __awaiter(this, void 0, void 0, function* () {
    const schematicOptions = mapConfigurationSchematicOptions(args.concat(options));
    schematicOptions.push(new schematics_1.SchematicOption('collection', '@nestjs/schematics'));
    yield collection.execute('configuration', schematicOptions);
});
const mapConfigurationSchematicOptions = (inputs) => {
    return inputs.reduce((schematicsOptions, option) => {
        if (option.name === 'name') {
            schematicsOptions.push(new schematics_1.SchematicOption('project', strings_1.dasherize(option.value)));
        }
        if (option.name === 'language') {
            schematicsOptions.push(new schematics_1.SchematicOption(option.name, option.value));
        }
        return schematicsOptions;
    }, []);
};
const installPackages = (inputs, options) => __awaiter(this, void 0, void 0, function* () {
    const installDirectory = strings_1.dasherize(inputs.find((input) => input.name === 'name').value);
    const dryRunMode = options.find((option) => option.name === 'dry-run')
        .value;
    const inputPackageManager = options.find((option) => option.name === 'package-manager').value;
    let packageManager;
    if (dryRunMode) {
        console.info();
        console.info(chalk_1.default.green(ui_1.messages.DRY_RUN_MODE));
        console.info();
        return;
    }
    if (inputPackageManager !== undefined) {
        try {
            packageManager = package_managers_1.PackageManagerFactory.create(inputPackageManager);
            yield packageManager.install(installDirectory);
        }
        catch (error) {
            if (error && error.message) {
                console.error(chalk_1.default.red(error.message));
            }
        }
    }
    else {
        packageManager = yield selectPackageManager();
        yield packageManager.install(installDirectory);
    }
});
const selectPackageManager = () => __awaiter(this, void 0, void 0, function* () {
    const answers = yield askForPackageManager();
    return package_managers_1.PackageManagerFactory.create(answers['package-manager']);
});
const askForPackageManager = () => __awaiter(this, void 0, void 0, function* () {
    const questions = [
        questions_1.generateSelect('package-manager')(ui_1.messages.PACKAGE_MANAGER_QUESTION)([
            package_managers_1.PackageManager.NPM,
            package_managers_1.PackageManager.YARN,
        ]),
    ];
    const prompt = inquirer.createPromptModule();
    return yield prompt(questions);
});
const printCollective = () => {
    const dim = print('dim');
    const yellow = print('yellow');
    const emptyLine = print();
    emptyLine();
    yellow(`Thanks for installing Nest ${ui_1.emojis.PRAY}`);
    dim('Please consider donating to our open collective');
    dim('to help us maintain this package.');
    emptyLine();
    emptyLine();
    print()(`${chalk_1.default.bold(`${ui_1.emojis.WINE}  Donate:`)} ${chalk_1.default.underline('https://opencollective.com/nest')}`);
    emptyLine();
};
const print = (color = null) => (str = '') => {
    const terminalCols = exports.retrieveCols();
    const strLength = str.replace(/\u001b\[[0-9]{2}m/g, '').length;
    const leftPaddingLength = Math.floor((terminalCols - strLength) / 2);
    const leftPadding = ' '.repeat(Math.max(leftPaddingLength, 0));
    if (color) {
        str = chalk_1.default[color](str);
    }
    console.log(leftPadding, str);
};
exports.retrieveCols = () => {
    const defaultCols = 80;
    try {
        const terminalCols = child_process_1.execSync('tput cols', {
            stdio: ['pipe', 'pipe', 'ignore'],
        });
        return parseInt(terminalCols.toString(), 10) || defaultCols;
    }
    catch (_a) {
        return defaultCols;
    }
};
