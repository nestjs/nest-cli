import { AbstractRunner, Runner, RunnerFactory } from '../lib/runners';

describe('New Command Specifications', () => {
  const directory = 'name';
  const nest: AbstractRunner = RunnerFactory.create(Runner.NEST) as AbstractRunner;
  const rm: AbstractRunner = RunnerFactory.create(Runner.CLEAN) as AbstractRunner;
  afterEach(async () => await rm.run(`-rf ${ directory }`));
  it('should generate a new typescript Nest project without package installation', async () => {
    const command = `new ${ directory } description 0.0.0 author -s`;
    await nest.run(command);
  });
  it('should generate a new Javascript Nest project without package installation', async () => {
    const command = `new ${ directory } description 0.0.0 author -s -l js`;
    await nest.run(command);
  });
});
