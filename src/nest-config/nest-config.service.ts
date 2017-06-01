import * as fs from 'fs';

import { NestConfig } from "./nest-config.model";

export class NestConfigService {
    public static getConfig(): NestConfig {
        /*
        let configPath = findUp.sync('nestconfig.json');

        if (!configPath) {
            return new NestConfig({
                language: "ts"
            });
        }

        let configJson = "";
        try {
            configJson = fs.readFileSync(configPath, 'utf8');
        } catch (ex) {
            throw "Could not read nestconfig.json";
        }

        try {
            return NestConfig.parse(configJson);
        } catch (ex) {
            throw "Could not parse nestconfig.json";
        }
        */
        return undefined;
    }
}