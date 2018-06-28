import { AbstractRunner, Runner, RunnerFactory } from '../lib/runners';

describe('New Command Specifications', () => {
  const runner: AbstractRunner = RunnerFactory.create(Runner.NEST) as AbstractRunner;
  it('should generate a new typescript Nest project without package installation', async () => {
    // execute command
    const command = 'new typescript-project description 0.0.0 author -s';
    await runner.run(command);
  });
  it('should generate a new Javascript Nest project without package installation', async () => {
    // execute command
    const command = 'new javascript-project description 0.0.0 author -s -l js';
    await runner.run(command);
  });
});
