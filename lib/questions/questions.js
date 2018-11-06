"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInput = (name) => {
    return (value) => {
        if (value === undefined) {
            return (defaultAnswer) => ({
                type: 'input',
                name,
                message: `${name} :`,
                default: defaultAnswer,
            });
        }
        return (defaultAnswer) => undefined;
    };
};
exports.generateSelect = (name) => {
    return (message) => {
        return (choices) => ({
            type: 'list',
            name,
            message,
            choices,
        });
    };
};
