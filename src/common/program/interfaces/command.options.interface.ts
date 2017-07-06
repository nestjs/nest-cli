export interface CommandOptions {}

export interface CreateCommandOptions extends CommandOptions {
  repository: string
}

export interface GenerateCommandOptions extends CommandOptions {}