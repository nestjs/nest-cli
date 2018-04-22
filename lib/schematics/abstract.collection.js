class AbstractCollection {
  constructor(collection, runner) {
    this.collection = collection;
    this.runner = runner;
  }

  execute(name, options) {
    const command = this._buildCommandLine(name, options);
    return this.runner.run(command);
  }

  _buildCommandLine(name, options) {
    return `${ this.collection }:${ name }${ this._buildOptions(options) }`;
  }

  _buildOptions(options) {
    return options.reduce((line, option) => {
      return line.concat(` ${ option.toCommandString() }`);
    }, '');
  }
}

module.exports = { AbstractCollection };