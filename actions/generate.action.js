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
const nest_configuration_loader_1 = require("../lib/configuration/nest-configuration.loader");
const readers_1 = require("../lib/readers");
const schematics_1 = require("../lib/schematics");
const abstract_action_1 = require("./abstract.action");
class GenerateAction extends abstract_action_1.AbstractAction {
    handle(inputs, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield generateFiles(inputs.concat(options));
        });
    }
}
exports.GenerateAction = GenerateAction;
const generateFiles = (inputs) => __awaiter(this, void 0, void 0, function* () {
    const configuration = yield loadConfiguration();
    const collection = schematics_1.CollectionFactory.create(configuration.collection);
    const schematicOptions = mapSchematicOptions(inputs);
    schematicOptions.push(new schematics_1.SchematicOption('language', configuration.language));
    schematicOptions.push(new schematics_1.SchematicOption('sourceRoot', configuration.sourceRoot));
    try {
        const schematicInput = inputs.find(input => input.name === 'schematic');
        if (!schematicInput) {
            throw new Error('Unable to find a schematic for this configuration');
        }
        yield collection.execute(schematicInput.value, schematicOptions);
    }
    catch (error) {
        if (error && error.message) {
            console.error(chalk_1.default.red(error.message));
        }
    }
});
const loadConfiguration = () => __awaiter(this, void 0, void 0, function* () {
    const loader = new nest_configuration_loader_1.NestConfigurationLoader(new readers_1.FileSystemReader(process.cwd()));
    return loader.load();
});
const mapSchematicOptions = (inputs) => {
    const options = [];
    inputs.forEach(input => {
        if (input.name !== 'schematic' && input.value !== undefined) {
            options.push(new schematics_1.SchematicOption(input.name, input.value));
        }
    });
    return options;
};
