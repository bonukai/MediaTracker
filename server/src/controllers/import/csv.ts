import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import csv from 'csv-parser';
import { Readable, Stream } from 'stream';
import { pipeline } from 'stream/promises';
import _ from 'lodash';
import { logger } from 'src/logger';

import { findMediaItemByExternalId } from 'src/metadata/findByExternalId';
import { updateMediaItem } from 'src/updateMetadata';
import { ExternalIds, MediaType, MediaItemDetailsResponse } from 'src/entity/mediaItem';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { listItemRepository } from 'src/repository/listItemRepository';
import { TvEpisodeFilters } from 'src/entity/tvepisode';

/**
 * @openapi_tags CsvImport
 */
export class CsvImportController {
  /**
   * @openapi_operationId import
   */
  import = createExpressRoute<{
    path: '/api/import-csv';
    method: 'post';
    requestBody: {
      file: string;
    };
    responseBody: CsvImport;
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { file } = req.body;

    const summary = await importFromCsv(file, userId);

    res.send(summary);
  });
}

type CsvImport = {
  file: string,
  inputCsvRows: CsvFileRow[];
  importedMediaItems: MediaItemDetailsResponse[];
  movie: number;
  tv: number;
  season: number;
  episode: number;
  video_game: number;
  book: number;
  audiobook: number;
};

export type CsvFileRow = {
  type: MediaType;
  externalSrc: string;
  externalId: string; 
  listId?: number;
  watched?: string;
  season?: number;
  episode?: number;
}

const requiredHeaders = ['type', 'externalsrc', 'externalid'];
const validTypes = ['tv', 'movie', 'game', 'book', 'audiobook'];
const validExternalSrcs = ['imdb', 'tmdb', 'tvdb', 'audible', 'openlibrary', 'igdb'];
const validTypesSrcs = [ 'tv|imdb', 'tv|tvdb', 'tv|tmdb', 'movie|imdb', 'movie|tmdb', 'game|igdb', 'book|openlibrary', 'audiobook|audible' ];

export const parseCsv = async (
  file: string
): Promise<CsvFileRow[]> => {
  logger.debug('Parsing CSV data from file string:', file);

  const csvRows: CsvFileRow[] = [];
  const stream = Readable.from(file);

  await pipeline(
    stream,
    csv({
      strict: true,
      mapHeaders: ({ header }) => header.toLowerCase(),
    }),
    async (source) => {
      for await (const row of source as AsyncIterable<any>) {
        logger.debug('CsvRow:', row);

        // Validate mandatory headers        
        const missingHeaders = requiredHeaders.filter(header => !(header in row));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: "${missingHeaders.join(', ')}"`);
        }

        // Validate "type"
        if (!validTypes.includes(row['type'])) {
          throw new Error(`Invalid type value: "${row['type']}"`);
        }

        // Validate "externalSrc"
        if (!validExternalSrcs.includes(row['externalsrc'])) {
          throw new Error(`Invalid externalSrc value: "${row['externalsrc']}"`);
        }

        // Validate "type+externalSrc" combination
        if (!validTypesSrcs.includes(row['type']+'|'+row['externalsrc'])) {
          throw new Error(`Invalid type and externalSrc combination: "${row['type']}", "${row['externalsrc']}"`);
        }
        
        // Validate "externalId"
        if (typeof row['externalid'] !== 'string' || row['externalid'].trim() === '') {
          throw new Error(`Invalid externalId value: "${row['externalid']}"`);
        }

        const csvRow: CsvFileRow = {
          type: row['type'],
          externalSrc: row['externalsrc'],
          externalId: row['externalid'],
          listId: row['listid'] ? Number(row['listid']) : undefined,
          watched: row['watched'],
          season: row['season'] ? Number(row['season']) : undefined,
          episode: row['episode'] ? Number(row['episode']) : undefined,
        }

        // Add parsed row to results
        csvRows.push(csvRow);
      }
    }
  ).catch((error) => {
    logger.error('Error processing the CSV file:', error);
    throw error;
  });

  logger.debug('Finished parsing CSV data:', csvRows);
  return csvRows;
};

export const importFromCsv = async (
  file: string,
  userId: number
): Promise<CsvImport> => {

  logger.debug('Beginning CSV import of file:', file);
  const csvResults: CsvImport = { file: file, inputCsvRows: [], importedMediaItems: [], movie: 0, tv: 0, season: 0, episode: 0, video_game: 0, book: 0, audiobook: 0 };

  csvResults.inputCsvRows = await parseCsv(file);

  for (const csvRow of csvResults.inputCsvRows) {
    logger.debug('Result:', csvRow);            // Log each result as it's processed

    const externalIds: ExternalIds = {};
    switch (csvRow.externalSrc) {
      case "imdb": 
        externalIds.imdbId = csvRow.externalId; break;
      case "tmdb":
        externalIds.tmdbId = parseInt(csvRow.externalId); break;
      case "tvdb": 
        externalIds.tvdbId = parseInt(csvRow.externalId); break;
      //case "igdb":                           //findMediaItemByExternalId doesnt support video_game ... yet
      //  externalIds.igdbId = parseInt(csvRow.externalId); break;
      case "audible": 
        externalIds.audibleId = csvRow.externalId; break;
      case "openlibrary":
        externalIds.openlibraryId = csvRow.externalId; break;
    }

    let mediaItem = await findMediaItemByExternalId({
      id: externalIds,
      mediaType: csvRow.type,
    });

    if (mediaItem) {
      if (mediaItem.needsDetails)
        mediaItem = await updateMediaItem(mediaItem);

      logger.debug(`found ${mediaItem.mediaType}: ${mediaItem.title} for user ${userId}`);

      //increment processing summary counter
      csvResults[csvRow.type] += 1;

      const details = await mediaItemRepository.details({
        mediaItemId: mediaItem.id,
        userId: userId,
      });

      logger.debug('mediaItemDetails:', details);

      //mark item as seen (if not already)
      if (csvRow.watched === 'Y') {
        logger.debug(`adding ${mediaItem.mediaType}: ${mediaItem.title} to seen history of user ${userId}`);
      
        let seen = false;

        if (csvRow.type == "tv") {
          
          //get all episodes from all seasons for a show
          let episodes = details.seasons.flatMap(season => season.episodes);

          //filter out all episodes <= the season and episode number given
          if (csvRow.season >= 0 && csvRow.episode >= 0) {
            episodes = episodes.filter((episode) =>
              episode.seasonNumber < csvRow.season ||
              (episode.seasonNumber === csvRow.season &&
                episode.episodeNumber <= csvRow.episode))
          }

          //filter out watched, unreleased (in future) and specials
          episodes = episodes
            .filter(TvEpisodeFilters.unwatchedEpisodes)
            .filter(TvEpisodeFilters.releasedEpisodes)
            .filter(TvEpisodeFilters.nonSpecialEpisodes);
          
          //mark remaining episodes as seen
          const seenMany = await seenRepository.createMany(
            episodes.map((episode) => ({
              userId: userId,
              mediaItemId: mediaItem.id,
              seasonId: episode.seasonId,
              episodeId: episode.id,
              date: null,
              duration: episode.runtime * 60 * 1000 || mediaItem.runtime * 60 * 1000,
            }))
          );
          
          //sanity check
          seen = seenMany.length == episodes.length;
          
          //increment the season and episode counters by the total, not just seen count
          csvResults.season += details.numberOfSeasons;
          csvResults.episode += details.numberOfEpisodes;

        } else if (!(details.seen)) {

          seen = await seenRepository.create({
            userId: userId,
            mediaItemId: mediaItem.id,
            duration: mediaItem.runtime,
          });  

        }

        if (seen) logger.debug(`added ${mediaItem.mediaType}: ${mediaItem.title} to seen history of user ${userId}`);
      }

      //add item to list (if it doesnt exist already)
      if (csvRow.listId > 0 && (!(details.lists.some((list) => list.id == csvRow.listId)))) {
        logger.debug(`adding ${mediaItem.mediaType}: ${mediaItem.title} to listId ${csvRow.listId} for user ${userId}`);

        if (await listItemRepository.addItem({
          listId: csvRow.listId,
          mediaItemId: mediaItem.id,
          userId: userId
        })) {
          logger.debug(`added ${mediaItem.mediaType}: ${mediaItem.title} to listId ${csvRow.listId} for user ${userId}`);
        }

      }

      csvResults.importedMediaItems.push(details);
    }
  }
    
  return csvResults;
};
