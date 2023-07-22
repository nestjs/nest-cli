export interface CommandStorageEntry<
  TValue extends boolean | string = boolean | string,
> {
  readonly name: string;
  readonly value: TValue;
  readonly options?: any;
}

export class CommandStorage {
  private readonly inputsByName = new Map<
    CommandStorageEntry['name'],
    CommandStorageEntry
  >();

  forEachEntry(callback: (input: CommandStorageEntry) => void): void {
    this.inputsByName.forEach((input) => callback(input));
  }

  /**
   * Add a new input to the storage if it does not exist yet.
   */
  add(input: CommandStorageEntry) {
    if (!this.inputsByName.has(input.name)) {
      this.inputsByName.set(input.name, input);
    }
  }

  /**
   * Overwrite a existing input to a new value the storage or create a new entry
   * if it does not exist yet.
   */
  set(input: CommandStorageEntry) {
    this.inputsByName.set(input.name, input);
  }

  get<TValue extends boolean | string>(
    inputName: CommandStorageEntry['name'],
  ): CommandStorageEntry<TValue> | undefined;
  get<TValue extends boolean | string>(
    inputName: CommandStorageEntry['name'],
    errorOnMissing: false,
  ): CommandStorageEntry<TValue> | undefined;
  get<TValue extends boolean | string>(
    inputName: CommandStorageEntry['name'],
    errorOnMissing: true,
  ): CommandStorageEntry<TValue>;
  get<TValue extends boolean | string>(
    inputName: CommandStorageEntry['name'],
    errorOnMissing = false,
  ): CommandStorageEntry<TValue> | undefined {
    const input = this.inputsByName.get(inputName) as
      | CommandStorageEntry<TValue>
      | undefined;
    if (errorOnMissing) {
      if (!input) {
        throw new Error(`The input ${inputName} is missing!`);
      }
    }
    return input;
  }

  /**
   * Copy all inputs of the other command storage with this one.
   * Note that if an input already exists, it will **not** be overwritten.
   */
  mergeWith(otherStorage: CommandStorage): void {
    for (const input of otherStorage.inputsByName.values()) {
      this.add(input);
    }
  }
}
