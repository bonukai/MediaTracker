import { generateApi } from 'swagger-typescript-api';
import path from 'path';

generateApi({
  name: 'index.ts',
  output: path.resolve(process.cwd(), './../rest-api/'),
  input: path.resolve(process.cwd(), './openapi.json'),
  httpClientType: 'fetch',
  defaultResponseAsSuccess: true,
  generateRouteTypes: true,
  unwrapResponseData: true,
  cleanOutput: false,
  enumNamesAsValues: false,
  moduleNameIndex: 1,
  generateUnionEnums: true,
});
