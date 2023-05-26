import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { AbstractCollection } from './abstract.collection';
import { Schematic } from './nest.collection';

export interface CollectionSchematic {
  schema: string;
  description: string;
  aliases: string[];
}

export class CustomCollection extends AbstractCollection {
  public getSchematics(): Schematic[] {
    const workflow = new NodeWorkflow(process.cwd(), {});
    const collection = workflow.engine.createCollection(this.collection);
    const collectionDescs = [
      collection.description,
      ...(collection.baseDescriptions ?? []),
    ];
    const usedNames = new Set<string>();
    const schematics: Schematic[] = [];
    for (const collectionDesc of collectionDescs) {
      const schematicsDescs = Object.entries(collectionDesc.schematics);
      for (const [name, { description, aliases = [] }] of schematicsDescs) {
        if (usedNames.has(name)) continue;
        usedNames.add(name);
        const alias = aliases.find((a) => !usedNames.has(a)) ?? name;
        for (const alias of aliases) {
           usedNames.add(alias);
        }
        schematics.push({ name, alias, description });
      }
    }
    return schematics.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
  }
}
