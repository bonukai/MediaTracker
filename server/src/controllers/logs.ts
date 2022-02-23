import { onlyForAdmin } from 'src/auth';
import { getLogs, LogEntry } from 'src/logger';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

/**
 * @openapi_tags Logs
 */
export class LogsController {
  /**
   * @openapi_operationId get
   */
  add = createExpressRoute<{
    method: 'get';
    path: '/api/logs';
    responseBody: LogEntry[];
  }>(onlyForAdmin, async (req, res) => {
    const logs = await getLogs();
    res.send(logs);
  });
}
