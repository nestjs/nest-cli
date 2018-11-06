export declare class AbstractRunner {
    protected binary: string;
    constructor(binary: string);
    run(command: string, collect?: boolean, cwd?: string): Promise<null | string>;
}
