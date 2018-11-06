import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManagerCommands } from './package-manager-commands';
export declare class YarnPackageManager extends AbstractPackageManager {
    constructor();
    readonly name: string;
    readonly cli: PackageManagerCommands;
}
