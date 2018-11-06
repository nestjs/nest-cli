"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_runner_1 = require("./abstract.runner");
class NpmRunner extends abstract_runner_1.AbstractRunner {
    constructor() {
        super('npm');
    }
}
exports.NpmRunner = NpmRunner;
