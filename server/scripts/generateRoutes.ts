import { typescriptRoutesToOpenApi } from 'typescript-routes-to-openapi';
import { version } from '../package.json';

typescriptRoutesToOpenApi({
  openapi: {
    info: {
      title: 'MediaTracker',
      version: version,
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    components: {
      securitySchemes: {
        ApiKey: {
          type: 'apiKey',
          in: 'query',
          name: 'token',
        },
        ApiHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'Access-Token',
        },
      },
    },
    security: [
      {
        ApiKey: [],
      },
      {
        ApiHeader: [],
      },
    ],
  },
  routesOutputDir: './src/generated/routes',
  checkProgramForErrors: false,
});
