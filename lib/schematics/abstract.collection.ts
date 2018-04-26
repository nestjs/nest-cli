export class AbstractCollection {
  constructor(protected collection, protected runner) {}

  public execute(name, options) {
    const command = this.buildCommandLine(name, options);
    return this.runner.run(command);
  }

  private buildCommandLine(name, options) {
    return `${ this.collection }:${ name }${ this.buildOptions(options) }`;
  }

  private buildOptions(options) {
    return options.reduce((line, option) => {
      return line.concat(` ${ option.toCommandString() }`);
    }, '');
  }
}
