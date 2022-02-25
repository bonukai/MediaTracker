import fs from 'fs-extra';
import _ from 'lodash';
import { basename } from 'path';

import { getLogs } from 'src/logger/getLogs';

jest
  .spyOn(fs, 'readdir')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .mockImplementation(async () => Object.keys(logs) as any);

jest
  .spyOn(fs, 'readFile')
  .mockImplementation(async (p) => _.get(logs, basename(String(p))));

describe('getLogs', () => {
  it('getLogs', async () => {
    const res = await getLogs();

    expect(res).toEqual(expectedResult);
  });

  it('should return only 1', async () => {
    const res = await getLogs({
      count: 1,
    });

    expect(res).toEqual(expectedResult.slice(0, 1));
  });

  it('should return only http logs', async () => {
    const res = await getLogs({
      levels: {
        http: true,
        debug: false,
        error: false,
        info: false,
        warn: false,
      },
    });

    expect(res).toEqual(
      expectedResult.filter((value) => value.level === 'http')
    );
  });

  it('should return only logs after index', async () => {
    const res = await getLogs({
      from: expectedResult[4].id,
    });

    expect(res).toEqual(expectedResult.slice(5));
  });

  it('should return empty array for invalid index', async () => {
    const res = await getLogs({
      from: '123456',
    });

    expect(res).toEqual([]);
  });
});

const logs = {
  'debug.log': `{"id":"WYl1D9buF9x83wr0_EdTYg8TTff8bf9sgVTp","level":"info","message":"MediaTracker listening at http://127.0.0.1:7481","timestamp":"2022-02-23T23:55:39.537Z"}
  `,
  'debug1.log': `{"id":"WYl1D9buF9x83wr0_EdTYg8TTff8bf9sgVTp","level":"info","message":"MediaTracker listening at http://127.0.0.1:7481","timestamp":"2022-02-25T23:55:39.537Z"}
  `,
  'http.log': `{"duration":9,"httpVersion":"1.1","id":"zF0JhLxoLpj4Pg_A8n8sbyMlFQnfuuUctTGA","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":209,"statusCode":200,"timestamp":"2022-02-24T23:46:24.501Z","type":"http","url":"/api/configuration"}
  {"duration":5,"httpVersion":"1.1","id":"zfXysXY8xhrZUzB25PqGWDam_WUx7LPiw1Ao","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":null,"statusCode":304,"timestamp":"2022-02-24T23:46:24.539Z","type":"http","url":"/api/user"}
  {"duration":6,"httpVersion":"1.1","id":"UxRZJbB8XNMq09PEXSK5Xx8MiNV5qIyfZvcA","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":null,"statusCode":304,"timestamp":"2022-02-24T23:46:24.542Z","type":"http","url":"/api/configuration"}`,
  'http1.log': `{"duration":2,"httpVersion":"1.1","id":"NHCKqcM6ZDdV9_xUiKz1FD1I2NXGG8mjmbpu","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":null,"statusCode":304,"timestamp":"2022-02-24T23:46:17.214Z","type":"http","url":"/api/configuration"}
  {"duration":7,"httpVersion":"1.1","id":"ht2x_Ov4SIixxjLTNE2uLVmoyaCC7ZIylQAP","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":19396,"statusCode":200,"timestamp":"2022-01-24T23:46:17.218Z","type":"http","url":"/api/logs?error=true&warn=true&info=true&http=false&debug=true&count=100"}
  {"duration":8,"httpVersion":"1.1","id":"-J_Nzbgh9zOAvXnpRuTgy1qm7ZwK-K0pCX4R","ip":"127.0.0.1","level":"http","message":"","method":"GET","responseSize":386,"statusCode":200,"timestamp":"2022-01-24T23:46:24.498Z","type":"http","url":"/api/user"}`,
};

const expectedResult = [
  {
    id: 'WYl1D9buF9x83wr0_EdTYg8TTff8bf9sgVTp',
    level: 'info',
    message: 'MediaTracker listening at http://127.0.0.1:7481',
    timestamp: '2022-02-25T23:55:39.537Z',
  },
  {
    duration: 6,
    httpVersion: '1.1',
    id: 'UxRZJbB8XNMq09PEXSK5Xx8MiNV5qIyfZvcA',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: null,
    statusCode: 304,
    timestamp: '2022-02-24T23:46:24.542Z',
    type: 'http',
    url: '/api/configuration',
  },
  {
    duration: 5,
    httpVersion: '1.1',
    id: 'zfXysXY8xhrZUzB25PqGWDam_WUx7LPiw1Ao',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: null,
    statusCode: 304,
    timestamp: '2022-02-24T23:46:24.539Z',
    type: 'http',
    url: '/api/user',
  },
  {
    duration: 9,
    httpVersion: '1.1',
    id: 'zF0JhLxoLpj4Pg_A8n8sbyMlFQnfuuUctTGA',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: 209,
    statusCode: 200,
    timestamp: '2022-02-24T23:46:24.501Z',
    type: 'http',
    url: '/api/configuration',
  },
  {
    duration: 2,
    httpVersion: '1.1',
    id: 'NHCKqcM6ZDdV9_xUiKz1FD1I2NXGG8mjmbpu',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: null,
    statusCode: 304,
    timestamp: '2022-02-24T23:46:17.214Z',
    type: 'http',
    url: '/api/configuration',
  },
  {
    id: 'WYl1D9buF9x83wr0_EdTYg8TTff8bf9sgVTp',
    level: 'info',
    message: 'MediaTracker listening at http://127.0.0.1:7481',
    timestamp: '2022-02-23T23:55:39.537Z',
  },
  {
    duration: 8,
    httpVersion: '1.1',
    id: '-J_Nzbgh9zOAvXnpRuTgy1qm7ZwK-K0pCX4R',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: 386,
    statusCode: 200,
    timestamp: '2022-01-24T23:46:24.498Z',
    type: 'http',
    url: '/api/user',
  },
  {
    duration: 7,
    httpVersion: '1.1',
    id: 'ht2x_Ov4SIixxjLTNE2uLVmoyaCC7ZIylQAP',
    ip: '127.0.0.1',
    level: 'http',
    message: '',
    method: 'GET',
    responseSize: 19396,
    statusCode: 200,
    timestamp: '2022-01-24T23:46:17.218Z',
    type: 'http',
    url: '/api/logs?error=true&warn=true&info=true&http=false&debug=true&count=100',
  },
];
