import { mediaItemRepository } from '../../src/repository/mediaItem';
import { tvEpisodeRepository } from '../../src/repository/episode';
import { tvSeasonRepository } from '../../src/repository/season';
import { userRepository } from '../../src/repository/user';
import { sessionRepository } from '../../src/repository/session';
import { accessTokenRepository } from '../../src/repository/accessToken';
import { metadataProviderCredentialsRepository } from '../../src/repository/metadataProviderCredentials';
import { notificationPlatformsCredentialsRepository } from '../../src/repository/notificationPlatformsCredentials';
import { seenRepository } from '../../src/repository/seen';
import { watchlistRepository } from '../../src/repository/watchlist';
import { userRatingRepository } from '../../src/repository/userRating';
import { notificationsHistoryRepository } from '../../src/repository/notificationsHistory';
import { knex } from '../../src/dbconfig';
import { migrationsDirectory } from '../../knexfile';

export const clearDatabase = async () => {
    await notificationPlatformsCredentialsRepository.delete();
    await notificationsHistoryRepository.delete();
    await metadataProviderCredentialsRepository.delete();
    await accessTokenRepository.delete();
    await sessionRepository.delete();
    await userRatingRepository.delete();
    await watchlistRepository.delete();
    await seenRepository.delete();
    await userRepository.delete();
    await tvEpisodeRepository.delete();
    await tvSeasonRepository.delete();
    await mediaItemRepository.delete();

    await knex.destroy();
};

export const runMigrations = async () => {
    await knex.migrate.latest({ directory: migrationsDirectory });
};
