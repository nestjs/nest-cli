import { Configuration, ConfigurationLoader } from '../../../lib/configuration';
import { NestConfigurationLoader } from '../../../lib/configuration/nest-configuration.loader';
import { Reader } from '../../../lib/readers';

describe('Nest Configuration Loader', () => {
  let reader: Reader;
  beforeAll(() => {
    const mock = jest.fn();
    mock.mockImplementation(() => {
      return {
        read: jest.fn(() => Promise.resolve(JSON.stringify({
          language: 'ts',
          collection: '@nestjs/schematics',
        }))),
      };
    });
    reader = mock();
  });
  it('should call reader.read when load', async () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader(reader);
    const configuration: Configuration = await loader.load();
    expect(reader.read).toHaveBeenCalledWith('.nestcli.json');
    expect(configuration).toEqual({
      language: 'ts',
      collection: '@nestjs/schematics',
    });
  });
});
