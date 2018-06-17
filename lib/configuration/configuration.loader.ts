export interface Configuration {
  [ key: string ]: string;
}

export interface ConfigurationLoader {
  load(): Configuration;
}
