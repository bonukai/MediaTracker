import { createExpressRoute } from 'typescript-routes-to-openapi-server';

import { onlyForAdmin } from 'src/auth';
import { LogEntry, LogLevels } from 'src/logger';
import { getLogs } from 'src/logger/getLogs';

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
    requestQuery: LogLevels & {
      count?: number;
      from?: string;
    };
    responseBody: LogEntry[];
  }>(onlyForAdmin, async (req, res) => {
    const { count, from, error, warn, http, debug, info } = req.query;

    const logs = await getLogs({
      levels: {
        error,
        warn,
        http,
        debug,
        info,
      },
      count,
      from,
    });
    res.send(logs);
  });
}
