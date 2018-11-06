"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
class SchematicOption {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    toCommandString() {
        if (typeof this.value === 'string') {
            if (this.name === 'name') {
                return `--${this.name}=${this.format()}`;
            }
            else if (this.name === 'version' || this.name === 'path') {
                return `--${this.name}=${this.value}`;
            }
            else {
                return `--${this.name}="${this.value}"`;
            }
        }
        else if (typeof this.value === 'boolean') {
            const str = core_1.strings.dasherize(this.name);
            return this.value ? `--${str}` : `--no-${str}`;
        }
        else {
            return `--${core_1.strings.dasherize(this.name)}=${this.value}`;
        }
    }
    format() {
        return core_1.strings
            .dasherize(this.value)
            .split('')
            .reduce((content, char) => {
            if (char === '(' || char === ')' || char === '[' || char === ']') {
                return `${content}\\${char}`;
            }
            return `${content}${char}`;
        }, '');
    }
}
exports.SchematicOption = SchematicOption;
