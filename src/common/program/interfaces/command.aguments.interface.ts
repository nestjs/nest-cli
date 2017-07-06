export interface CommandArguments {}

export interface CreateCommandArguments extends CommandArguments {
  name: string
  destination?: string
}

export interface GenerateCommandArguments extends CommandArguments {
  assetType: string
  assetName: string
  moduleName: string
}