import {Readable, Transform, Writable} from 'stream';
import {expect} from 'chai';
import {BufferedReadable, BufferedWritable} from './test.utils';
import {Replacer} from '../../../../common/asset/interfaces/replacer.interface';
import {AssetReplacer} from '../../../../common/asset/interfaces/asset-replacer.interface';
import {ReplaceTransform} from '../replace.transform';

describe('ReplaceTransform', () => {
  it('should replace data in the stream', done => {
    const reader: Readable = new BufferedReadable(Buffer.from('class __CLASS_NAME__'));
    const replacer: AssetReplacer = {
      __CLASS_NAME__: 'value'
    };
    const transformer: Transform = new ReplaceTransform(replacer);
    const writer: Writable = new BufferedWritable();

    reader.on('end', () => {
      expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal('class value');
      done();
    });
    reader
      .pipe(transformer)
      .pipe(writer);
  });

  it('should replace multiple same data in the stream', done => {
    const reader: Readable = new BufferedReadable(Buffer.from('__CLASS_NAME__\n__CLASS_NAME__'));
    const replacer: Replacer = {
      __CLASS_NAME__: 'value'
    };
    const transformer: Transform = new ReplaceTransform(replacer);
    const writer: Writable = new BufferedWritable();

    reader.on('end', () => {
      expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal('value\nvalue');
      done();
    });
    reader
      .pipe(transformer)
      .pipe(writer);
  });

  it('should replace multiple replace data in the stream', done => {
    const reader: Readable = new BufferedReadable(Buffer.from('__CLASS_NAME__\n__IMPORT__'));
    const replacer: Replacer = {
      __CLASS_NAME__: 'className',
      __IMPORT__: 'import'

    };
    const transformer: Transform = new ReplaceTransform(replacer);
    const writer: Writable = new BufferedWritable();

    reader.on('end', () => {
      expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal('className\nimport');
      done();
    });
    reader
      .pipe(transformer)
      .pipe(writer);
  });
});
