export interface Input<TValue extends boolean | string = boolean | string> {
  name: string;
  value: TValue;
  options?: any;
}

export class CommandInputsContainer {
  private readonly inputsByName = new Map<Input['name'], Input>();

  toArray(): Input[] {
    return Array.from(this.inputsByName.values())
  }

  addInput(input: Input) {
    this.inputsByName.set(input.name, input);
  }

  resolveInput<TValue extends boolean | string>(
    inputName: Input['name'],
  ): Input<TValue> | undefined;
  resolveInput<TValue extends boolean | string>(
    inputName: Input['name'],
    errorOnMissing: false,
  ): Input<TValue> | undefined;
  resolveInput<TValue extends boolean | string>(
    inputName: Input['name'],
    errorOnMissing: true,
  ): Input<TValue>;
  resolveInput<TValue extends boolean | string>(
    inputName: Input['name'],
    errorOnMissing = false
  ): Input<TValue> | undefined {
    const input = this.inputsByName.get(inputName) as Input<TValue> | undefined;
    if (errorOnMissing) {
      if (!input) {
        throw new Error(`The input ${inputName} is missing!`);
      }
    }
    return input
  }
}
