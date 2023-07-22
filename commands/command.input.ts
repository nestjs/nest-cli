export interface CommandStorageEntry<
  TValue extends boolean | string = boolean | string,
> {
  name: string;
  value: TValue;
  options?: any;
}

export class CommandStorage {
  private readonly inputsByName = new Map<
    CommandStorageEntry['name'],
    CommandStorageEntry
  >();

  /**
   * @returns A new array containing all the inputs.
   */
  toArray(): CommandStorageEntry[] {
    return Array.from(this.inputsByName.values());
  }

  /**
   * Add a new input to the storage if it does not exist yet.
   */
  add(input: CommandStorageEntry) {
    if (!this.inputsByName.has(input.name)) {
      this.inputsByName.set(input.name, input);
    }
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
