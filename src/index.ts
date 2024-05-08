#!/usr/bin/env node

import chalk from 'chalk';
import { Command, InvalidArgumentError, Option, program } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { z, ZodSchema } from 'zod';

import { demoteAdmin, listUsers, promoteAdmin, resetPassword } from './cli.js';
import { Database, DatabaseConfig } from './database.js';
import { startServer } from './server.js';
import { StaticConfiguration } from './staticConfiguration.js';
import { h } from './utils.js';

const inputValidator = (zodSchema: ZodSchema) => {
  return (value: string) => {
    const parsedValue = zodSchema.safeParse(value);

    if (parsedValue.success) {
      return parsedValue.data;
    }

    throw new InvalidArgumentError(
      parsedValue.error.issues?.at(0)?.message || 'invalid value'
    );
  };
};

const requireFileToExist = (value: string) => {
  const filePath = path.resolve(value);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  throw new InvalidArgumentError(h`file ${filePath} does not exists`);
};

const createDirectories = (value: string) => {
  const p = path.resolve(value);
  fs.mkdirSync(p, { recursive: true });
  return p;
};

const databaseClientSchema = z.enum(['SQLite', 'PostgreSQL']);

program
  .version('1.0.0')
  .addOption(
    new Option('--db-client <string>', 'database client')
      .choices(databaseClientSchema.options)
      .default('SQLite')
  )
  .addOption(
    new Option('--db-filepath <path>', 'SQLite database path').default(
      path.resolve(os.homedir(), '.mediatracker', 'data.db')
    )
  )
  .addOption(
    new Option(
      '--db-connection-string <string>',
      'PostgreSQL database connection string'
    ).conflicts('db-filepath')
  )
  .addOption(
    new Option('--logs-dir <path>', 'logs directory')
      .default(path.resolve(os.homedir(), '.mediatracker', 'logs'))
      .argParser(createDirectories)
  )
  .addOption(
    new Option('--assets-dir <path>', 'assets (posters/backdrops) directory')
      .default(path.resolve(os.homedir(), '.mediatracker', 'img'))
      .argParser(createDirectories)
  )
  .addOption(new Option('--demo', 'demo mode'));

const commands: Command[] = [];

const addCommand = (args: {
  command: Command;
  action: (args: {
    args: string[];
    opts: Record<string, string>;
  }) => void | Promise<void>;
}) => {
  const command = args.command
    .configureHelp({
      showGlobalOptions: true,
    })
    .action(() => {
      command.setOptionValue('action', async () => {
        await args.action({ args: command.args, opts: command.opts() });
      });
    });

  program.addCommand(command);
  commands.push(command);
};

addCommand({
  command: new Command('list-users'),
  action: listUsers,
});

addCommand({
  command: new Command('reset-password')
    .argument('username')
    .argument('password'),
  action: async ({ args }) => {
    const [username, password] = args;
    await resetPassword({ username, password });
  },
});

addCommand({
  command: new Command('promote-admin').argument('username'),
  action: ({ args }) => promoteAdmin({ username: args[0] }),
});

addCommand({
  command: new Command('demote-admin').argument('username'),
  action: ({ args }) => demoteAdmin({ username: args[0] }),
});

addCommand({
  command: new Command('start-server')
    .option(
      '--port <number>',
      'port',
      inputValidator(z.coerce.number().int().min(1).max(65535)),
      7481
    )
    .option(
      '--address <IP>',
      'IP address',
      inputValidator(z.coerce.string().ip())
    )
    .option('--https')
    .option('--key <path>', 'SSL key path', requireFileToExist)
    .option('--cert <path>', 'SSL certificate path', requireFileToExist),
  action: async ({ opts }) => {
    const { port, address, https, key, cert } = opts;

    const keyContent = key ? fs.readFileSync(key) : undefined;
    const certContent = cert ? fs.readFileSync(cert) : undefined;

    if (https) {
      if (!key || !cert) {
        throw new Error(
          `when using --https flag, booth key and cert needs to be provided`
        );
      }
    }

    await startServer({
      port: Number(port),
      address,
      protocol: https ? 'https' : 'http',
      key: keyContent,
      cert: certContent,
    });
  },
});

await program.parseAsync(process.argv);

const opts = program.opts();

const optsSchema = z.object({
  dbClient: databaseClientSchema,
  dbFilepath: z.string().optional(),
  dbConnectionString: z.string().optional(),
  logsDir: z.string(),
  assetsDir: z.string(),
  demo: z.coerce.boolean(),
});

const { dbClient, dbFilepath, dbConnectionString, assetsDir, logsDir, demo } =
  optsSchema.parse(opts);

StaticConfiguration.init({
  assetsDir,
  logsDir,
  demoMode: demo,
});

const validateDatabaseConfig = (): DatabaseConfig => {
  if (dbClient === 'SQLite') {
    if (typeof dbConnectionString === 'string') {
      throw new Error(
        `--db-connection-string option cannot be used with SQLite`
      );
    }

    if (typeof dbFilepath !== 'string') {
      throw new Error(`--db-filepath is required with SQLite`);
    }

    return {
      client: 'better-sqlite3',
      filename: path.resolve(dbFilepath),
    };
  } else if (dbClient === 'PostgreSQL') {
    if (typeof dbConnectionString !== 'string') {
      throw new Error(
        `--db-connection-string option is required with PostgreSQL`
      );
    }

    if (typeof dbFilepath === 'string') {
      throw new Error(`--db-filepath option cannot be used with PostgreSQL`);
    }

    return {
      client: 'pg',
      connectionString: dbConnectionString,
    };
  }

  throw new Error(`unsupported database client ${dbClient}`);
};

Database.init(validateDatabaseConfig());

const selectedCommand = commands
  .map((item) => item.opts().action)
  .find(Boolean);

if (typeof selectedCommand === 'function') {
  try {
    await selectedCommand();
  } catch (error) {
    if (error instanceof Error && error.stack) {
      console.log(chalk.bold.red(error.stack));
    } else {
      console.log(chalk.bold.red(error));
    }
  } finally {
    await Database.close();
  }
}
