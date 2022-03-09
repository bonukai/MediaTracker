// import { Knex } from 'knex';
// import path from 'path';
// import { Config } from 'src/config';

// export const migrationsDirectory = path.resolve(__dirname, 'migrations');

// const knexConfig: Record<string, Knex.Config> = {
//   production: {
//     client: Config.DATABASE_CLIENT,
//     version: Config.DATABASE_VERSION,
//     connection: {
//       connectionString: Config.DATABASE_URL,
//       host: Config.DATABASE_HOST,
//       port: Config.DATABASE_PORT,
//       user: Config.DATABASE_USER,
//       password: Config.DATABASE_PASSWORD,
//       database: Config.DATABASE_DATABASE,
//       ssl: Config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
//       filename: Config.DATABASE_PATH,
//     },
//     useNullAsDefault: true,
//     migrations: {
//       extension: Config.MIGRATIONS_EXTENSION,
//     },
//   },
// };

// export default knexConfig;
