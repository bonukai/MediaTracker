const path = require('path');
const { generateApi } = require('swagger-typescript-api');

generateApi({
    name: 'index.ts',
    output: path.resolve(process.cwd(), './../rest-api/'),
    input: path.resolve(process.cwd(), './openapi.json'),
    httpClientType: 'fetch',
    apiClassName: 'MediaTracker',
    defaultResponseAsSuccess: true,
    generateRouteTypes: true,
    unwrapResponseData: true,
    cleanOutput: false,
    enumNamesAsValues: false,
    moduleNameIndex: 1,
    generateUnionEnums: true,
});
