import { Server } from 'src/server';

describe('createServer', () => {
  test('passing empty session key should throw exception', () => {
    expect(
      () =>
        new Server({
          hostname: '127.0.0.1',
          port: 1234,
          assetsPath: '.',
          publicPath: '.',
          sessionKey: '',
          production: false,
        })
    ).toThrow(/sessionKey/);
  });

  test('createServer', async () => {
    const server = new Server({
      hostname: '127.0.0.1',
      port: 1234,
      assetsPath: '.',
      publicPath: '.',
      sessionKey: 'sessionKey',
      production: false,
    });

    await expect(async () => server.listen()).rejects.toThrow();

    server.create();

    await server.listen();
    await server.close();
  });
});
