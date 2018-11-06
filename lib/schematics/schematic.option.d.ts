export declare class SchematicOption {
    private name;
    private value;
    constructor(name: string, value: boolean | string);
    toCommandString(): string;
    private format();
}
