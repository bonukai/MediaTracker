#!/usr/bin/env node
/* eslint-disable node/shebang */

import 'source-map-support/register';

import express from 'express';
import chalk from 'chalk';
import { t } from '@lingui/macro';

import { GlobalConfiguration } from 'src/repository/globalSettings';
import { updateMediaItems } from 'src/updateMetadata';
import { catchAndLogError } from 'src/utils';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { CancellationToken } from 'src/cancellationToken';
import { logger } from 'src/logger';
import { createServer, startServer } from 'src/server';
import { Config } from 'src/config';

let updateMetadataCancellationToken: CancellationToken;

GlobalConfiguration.subscribe('tmdbLang', async (value, previousValue) => {
  if (!previousValue) {
    return;
  }

  logger.info(
    chalk.bold.green(
      t`TMDB language changed to: "${value}", updating metadata for all items`
    )
  );

  if (updateMetadataCancellationToken) {
    await updateMetadataCancellationToken.cancel();
  }

  updateMetadataCancellationToken = new CancellationToken();

  const mediaItems = await mediaItemRepository.find({
    source: 'tmdb',
  });

  await updateMediaItems({
    mediaItems: mediaItems,
    cancellationToken: updateMetadataCancellationToken,
    forceUpdate: true,
  });
});

catchAndLogError(async () => {
  try {
    const server = await createServer();
    await startServer(server);
  } catch (error) {
    console.log(error);
    console.log(typeof error);
    console.log(chalk.bold.red('error: Initialization failed'));

    const server = express();
    server.all('*', (req, res) => {
      res.status(500);
      res.send(
        String.raw`
          <!DOCTYPE html>
          <html lang="en">
            <meta charset="UTF-8" />
            <title>MediaTracker</title>
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            />
            <style></style>
            <body>
              <div>
                <h1>500: Server error</h1>
                <p>${String(error)}</p>
              </div>
            </body>
          </html>
        `
      );
    });
    server.listen(Config.PORT, Config.HOSTNAME, () => {
      const address = `http://${Config.HOSTNAME}:${Config.PORT}`;
      console.log(`starting server at ${address}`);
    });
  }
});
