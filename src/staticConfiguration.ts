import path from 'path';

import { logger } from './logger.js';
import { h } from './utils.js';

export class StaticConfiguration {
  static #hasBeenInitialized: boolean;
  static #logsDir: string;
  static #assetsDir: string;

  static init(args: { logsDir: string; assetsDir: string }) {
    if (StaticConfiguration.#hasBeenInitialized === true) {
      throw new Error(`StaticConfiguration has already been initialized`);
    }

    StaticConfiguration.#logsDir = path.resolve(args.logsDir);
    StaticConfiguration.#assetsDir = path.resolve(args.assetsDir);
    StaticConfiguration.#hasBeenInitialized = true;

    logger.info(h`logs dir: ${StaticConfiguration.#logsDir}`);
    logger.info(h`assets dir: ${StaticConfiguration.#assetsDir}`);
  }

  static get logsDir() {
    return StaticConfiguration.#logsDir;
  }

  static get assetsDir() {
    return StaticConfiguration.#assetsDir;
  }
}
