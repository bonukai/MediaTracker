#!/usr/bin/env node
/* eslint-disable node/shebang */

import 'source-map-support/register';

import chalk from 'chalk';
import { t } from '@lingui/macro';

import { GlobalConfiguration } from 'src/repository/globalSettings';
import { updateMediaItems } from 'src/updateMetadata';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { CancellationToken } from 'src/cancellationToken';
import { logger } from 'src/logger';
import { createAndStartServer } from 'src/server';

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

createAndStartServer();
