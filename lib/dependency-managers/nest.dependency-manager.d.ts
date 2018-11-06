import { AbstractPackageManager } from '../package-managers';
export declare class NestDependencyManager {
    private packageManager;
    constructor(packageManager: AbstractPackageManager);
    read(): Promise<string[]>;
    update(force: boolean, tag: string): Promise<void>;
}
