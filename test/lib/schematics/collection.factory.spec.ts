import { describe, expect, it } from 'vitest';
import { CollectionFactory } from '../../../lib/schematics/collection.factory.js';
import { Collection } from '../../../lib/schematics/collection.js';
import { CustomCollection } from '../../../lib/schematics/custom.collection.js';
import { NestCollection } from '../../../lib/schematics/nest.collection.js';

describe('CollectionFactory', () => {
  it('should create a NestCollection for the NestJS collection', () => {
    const collection = CollectionFactory.create(Collection.NESTJS);
    expect(collection).toBeInstanceOf(NestCollection);
  });

  it('should create a NestCollection when passed the string value', () => {
    const collection = CollectionFactory.create('@nestjs/schematics');
    expect(collection).toBeInstanceOf(NestCollection);
  });

  it('should create a CustomCollection for a non-NestJS collection', () => {
    const collection = CollectionFactory.create('@custom/schematics');
    expect(collection).toBeInstanceOf(CustomCollection);
  });

  it('should create a CustomCollection for any arbitrary collection name', () => {
    const collection = CollectionFactory.create('my-local-schematics');
    expect(collection).toBeInstanceOf(CustomCollection);
  });
});
