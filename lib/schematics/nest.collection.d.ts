import { AbstractRunner } from '../runners';
import { AbstractCollection } from './abstract.collection';
import { SchematicOption } from './schematic.option';
export declare class NestCollection extends AbstractCollection {
    private schematics;
    constructor(runner: AbstractRunner);
    execute(name: string, options: SchematicOption[]): Promise<void>;
    private validate(name);
}
