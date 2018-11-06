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
const fs_1 = require("fs");
const os_1 = require("os");
const osName = require("os-name");
const path_1 = require("path");
const package_managers_1 = require("../lib/package-managers");
const ui_1 = require("../lib/ui");
const abstract_action_1 = require("./abstract.action");
class InfoAction extends abstract_action_1.AbstractAction {
    handle() {
        return __awaiter(this, void 0, void 0, function* () {
            displayBanner();
            yield displaySystemInformation();
            yield displayNestInformation();
        });
    }
}
exports.InfoAction = InfoAction;
const displayBanner = () => {
    console.info(chalk_1.default.red(ui_1.BANNER));
};
const displaySystemInformation = () => __awaiter(this, void 0, void 0, function* () {
    console.info(chalk_1.default.green('[System Information]'));
    console.info('OS Version     :', chalk_1.default.blue(osName(os_1.platform(), os_1.release())));
    console.info('NodeJS Version :', chalk_1.default.blue(process.version));
    yield displayPackageManagerVersion();
});
const displayPackageManagerVersion = () => __awaiter(this, void 0, void 0, function* () {
    const manager = yield package_managers_1.PackageManagerFactory.find();
    try {
        const version = yield manager.version();
        console.info(`${manager.name} Version    :`, chalk_1.default.blue(version));
    }
    catch (_a) {
        console.error(`${manager.name} Version    :`, chalk_1.default.red('Unknown'));
    }
});
const displayNestInformation = () => __awaiter(this, void 0, void 0, function* () {
    console.info(chalk_1.default.green('[Nest Information]'));
    try {
        const dependencies = yield readProjectPackageJsonDependencies();
        displayNestVersions(dependencies);
    }
    catch (_b) {
        console.error(chalk_1.default.red(ui_1.messages.NEST_INFORMATION_PACKAGE_MANAGER_FAILED));
    }
});
const readProjectPackageJsonDependencies = () => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        fs_1.readFile(path_1.join(process.cwd(), 'package.json'), (error, buffer) => {
            if (error !== undefined && error !== null) {
                reject(error);
            }
            else {
                resolve(JSON.parse(buffer.toString()).dependencies);
            }
        });
    });
});
const displayNestVersions = (dependencies) => {
    buildNestVersionsMessage(dependencies)
        .forEach((dependency) => console.info(dependency.name, chalk_1.default.blue(dependency.value)));
};
const buildNestVersionsMessage = (dependencies) => {
    const nestDependencies = collectNestDependencies(dependencies);
    return format(nestDependencies);
};
const collectNestDependencies = (dependencies) => {
    const nestDependencies = [];
    Object.keys(dependencies).forEach((key) => {
        if (key.indexOf('@nestjs') > -1) {
            nestDependencies.push({
                name: `${key.replace(/@nestjs\//, '')} version`,
                value: dependencies[key],
            });
        }
    });
    return nestDependencies;
};
const format = (dependencies) => {
    const sorted = dependencies.sort((dependencyA, dependencyB) => dependencyB.name.length - dependencyA.name.length);
    const length = sorted[0].name.length;
    sorted.forEach((dependency) => {
        if (dependency.name.length < length) {
            dependency.name = rightPad(dependency.name, length);
        }
        dependency.name = dependency.name.concat(' :');
        dependency.value = dependency.value.replace(/(\^|\~)/, '');
    });
    return sorted;
};
const rightPad = (name, length) => {
    while (name.length < length) {
        name = name.concat(' ');
    }
    return name;
};
