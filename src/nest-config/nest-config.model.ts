export class NestConfig {
    public language: "ts" | "es";
    
    public constructor(parsedJson: any) {
        this.language = parsedJson["language"];
    }

    public static parse(json: string) {
        return new NestConfig(JSON.parse(json));
    }
}