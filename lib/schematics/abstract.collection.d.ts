import { AbstractRunner } from '../runners';
import { SchematicOption } from './schematic.option';
export declare class AbstractCollection {
    protected collection: string;
    protected runner: AbstractRunner;
    constructor(collection: string, runner: AbstractRunner);
    execute(name: string, options: SchematicOption[]): Promise<void>;
    private buildCommandLine(name, options);
    private buildOptions(options);
}
