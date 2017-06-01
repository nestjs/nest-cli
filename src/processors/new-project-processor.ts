import * as path from "path";
import * as rimraf from "rimraf";
import { NestConfig } from "../nest-config";

export class NewProjectProcessor {
    public constructor(
        private _appName: string,
        private _destinationDirectory: string,
        private _sourceRepository: string
    ) {
    }

    public async process() {
        return this.clone()
            .then(() => this.updatePackageJson())
    }

    private async clone() {
        /*
        return new Promise((resolve, reject) => {
            gitclone(this._sourceRepository, this._destinationDirectory, {}, () => {
                console.log(path.join(this._destinationDirectory , ".git"));
                rimraf(path.join(this._destinationDirectory , ".git"), () => {
                    resolve();
                });
            });
        });
        */
    }

    private async updatePackageJson() {
        /*
        const packageJsonPath = path.join(this._destinationDirectory, "package.json");

        let packageJson = jsonfile.readFileSync(packageJsonPath);
        packageJson.name = this._appName;

        jsonfile.writeFileSync(packageJsonPath, packageJson, {spaces: 4});
        */
    }
}