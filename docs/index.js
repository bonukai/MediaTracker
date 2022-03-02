import SwaggerUI from 'swagger-ui';
import './node_modules/swagger-ui/dist/swagger-ui.css';

const spec = require('../server/openapi.json');

SwaggerUI({
  spec: spec,
  dom_id: '#swagger',
});
