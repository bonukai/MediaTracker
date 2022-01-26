import { typescriptRoutesToOpenApi } from 'typescript-routes-to-openapi';

typescriptRoutesToOpenApi({
    openapi: {
        info: {
            title: 'MediaTracker',
            version: '0.0.1',
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
