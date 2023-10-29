export interface CommandContextEntry<
  TValue extends boolean | string = boolean | string,
> {
  readonly name: string;
  readonly value: TValue;
  readonly options?: any;
}

export class CommandContext {
  private readonly inputsByName = new Map<
    CommandContextEntry['name'],
    CommandContextEntry
  >();

  forEachEntry(callback: (input: CommandContextEntry) => void): void {
    this.inputsByName.forEach((input) => callback(input));
  }

  /**
   * Add a new input to the storage if it does not exist yet.
   */
  add(input: CommandContextEntry) {
    if (!this.inputsByName.has(input.name)) {
      this.inputsByName.set(input.name, input);
    }
  }

  /**
   * Overwrite a existing input to a new value the storage or create a new entry
   * if it does not exist yet.
   */
  set(input: CommandContextEntry) {
    this.inputsByName.set(input.name, input);
  }

  get<TValue extends boolean | string>(
    inputName: CommandContextEntry['name'],
  ): CommandContextEntry<TValue> | undefined;
  get<TValue extends boolean | string>(
    inputName: CommandContextEntry['name'],
    errorOnMissing: false,
  ): CommandContextEntry<TValue> | undefined;
  get<TValue extends boolean | string>(
    inputName: CommandContextEntry['name'],
    errorOnMissing: true,
  ): CommandContextEntry<TValue>;
  get<TValue extends boolean | string>(
    inputName: CommandContextEntry['name'],
    errorOnMissing = false,
  ): CommandContextEntry<TValue> | undefined {
    const input = this.inputsByName.get(inputName) as
      | CommandContextEntry<TValue>
      | undefined;
    if (errorOnMissing) {
      if (!input || input.value === undefined) {
        throw new Error(`The input ${inputName} is missing!`);
      }
    }
    return input;
  }

  /**
   * Copy all inputs of the other command storage with this one.
   * Note that if an input already exists, it will **not** be overwritten.
   */
  mergeWith(otherStorage: CommandContext): void {
    for (const input of otherStorage.inputsByName.values()) {
      this.add(input);
    }
  }
}
