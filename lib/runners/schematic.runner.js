"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const abstract_runner_1 = require("./abstract.runner");
class SchematicRunner extends abstract_runner_1.AbstractRunner {
    constructor() {
        super(`"${path_1.join(__dirname, '../..', 'node_modules/.bin/schematics')}"`);
    }
}
exports.SchematicRunner = SchematicRunner;
