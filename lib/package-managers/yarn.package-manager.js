"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runners_1 = require("../runners");
const abstract_package_manager_1 = require("./abstract.package-manager");
const package_manager_1 = require("./package-manager");
class YarnPackageManager extends abstract_package_manager_1.AbstractPackageManager {
    constructor() {
        super(runners_1.RunnerFactory.create(runners_1.Runner.YARN));
    }
    get name() {
        return package_manager_1.PackageManager.YARN.toUpperCase();
    }
    get cli() {
        return {
            install: 'install',
            add: 'add',
            update: 'upgrade',
            remove: 'remove',
            saveFlag: '',
            saveDevFlag: '-D',
        };
    }
}
exports.YarnPackageManager = YarnPackageManager;
