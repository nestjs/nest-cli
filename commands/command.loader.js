"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_1 = require("../actions");
const add_action_1 = require("../actions/add.action");
const update_action_1 = require("../actions/update.action");
const add_command_1 = require("./add.command");
const generate_command_1 = require("./generate.command");
const info_command_1 = require("./info.command");
const new_command_1 = require("./new.command");
const update_command_1 = require("./update.command");
class CommandLoader {
    static load(program) {
        new new_command_1.NewCommand(new actions_1.NewAction()).load(program);
        new generate_command_1.GenerateCommand(new actions_1.GenerateAction()).load(program);
        new info_command_1.InfoCommand(new actions_1.InfoAction()).load(program);
        new update_command_1.UpdateCommand(new update_action_1.UpdateAction()).load(program);
        new add_command_1.AddCommand(new add_action_1.AddAction()).load(program);
    }
}
exports.CommandLoader = CommandLoader;
