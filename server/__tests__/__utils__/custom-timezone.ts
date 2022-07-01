import { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';
import NodeEnvironment from 'jest-environment-node';

export default class CustomTimezone extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, _context: EnvironmentContext) {
    const timezone = _context.docblockPragmas.timezone;

    if (typeof timezone !== 'string') {
      throw 'Add @timezone docblockPragmas';
    }

    process.env.TZ = timezone;
    super(config, _context);
  }
}
