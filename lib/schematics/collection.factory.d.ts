import { AbstractCollection } from './abstract.collection';
import { Collection } from './collection';
export declare class CollectionFactory {
    static create(collection: Collection): AbstractCollection;
}
