export const NODE_ENV = process.env['NODE_ENV'] as
    | 'development'
    | 'production'
    | 'test';
export const ASSETS_PATH = process.env['ASSETS_PATH'] || 'img';
export const PUBLIC_PATH = 'public';
export const DATABASE_PATH = process.env.DATABASE_PATH || './data.db';

export const DATABASE_CLIENT = process.env.DATABASE_CLIENT;
export const DATABASE_URL = process.env.DATABASE_URL;
export const DATABASE_VERSION = process.env.DATABASE_VERSION;
export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_PORT = process.env.DATABASE_PORT
    ? Number(process.env.DATABASE_PORT)
    : undefined;
export const DATABASE_USER = process.env.DATABASE_USER;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_DATABASE = process.env.DATABASE_DATABASE;
export const DATABASE_SSL = process.env.DATABASE_SSL
    ? Boolean(process.env.DATABASE_SSL)
    : undefined;

export const DEMO = process.env['DEMO'] ? Boolean(process.env['DEMO']) : false;
