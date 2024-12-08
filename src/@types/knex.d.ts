import 'knex';

import { AccessTokenModel } from '../entity/accessTokenModel.ts';
import { ConfigurationModel } from '../entity/configurationModel.ts';
import { EpisodeModel } from '../entity/episodeModel.ts';
import { ListItemModel, ListModel } from '../entity/listModel.ts';
import { MediaItemModel } from '../entity/mediaItemModel.ts';
import { ProgressModel } from '../entity/progressModel.ts';
import { SeasonModel } from '../entity/seasonModel.ts';
import { SeenEpisodesCount } from '../entity/seenEpisodesCount.ts';
import { SeenModel } from '../entity/seenModel.ts';
import { SessionKeyModel } from '../entity/sessionKeyModel.ts';
import { SessionModel } from '../entity/sessionModel.ts';
import { UserModel } from '../entity/userModel.ts';
import { UserRatingModel } from '../entity/userRatingModel.ts';
import {
  JustWatchAvailabilityModel,
  JustWatchProviderModel,
} from '../entity/justWatchModel.ts';
import { SeenEpisodesCountModel } from '../entity/seenEpisodesCountModel.ts';
import { ServerInternalSettingsModel } from '../entity/serverSettingsModel.ts';
import { MessageModel } from '../entity/messageModel.ts';
import { HomeSectionModel } from '../entity/homeSectionModel.ts';
import { HasBeenSeenModel } from '../entity/hasBeenSeenModel.ts';

declare module 'knex/types/tables.js' {
  interface Tables {
    user: UserModel;
    list: ListModel;
    seen: SeenModel;
    listItem: ListItemModel;
    mediaItem: MediaItemModel;
    season: SeasonModel;
    episode: EpisodeModel;
    userRating: UserRatingModel;
    progress: ProgressModel;
    session: SessionModel;
    serverInternalSettings: ServerInternalSettingsModel;
    configuration: ConfigurationModel;
    accessToken: AccessTokenModel;
    notificationsHistory: NotificationHistoryModel;
    justWatchProvider: JustWatchProviderModel;
    justWatchAvailability: JustWatchAvailabilityModel;
    seenEpisodesCount: SeenEpisodesCountModel;
    message: MessageModel;
    homeSection: HomeSectionModel;
    hasBeenSeen: HasBeenSeenModel;
  }
}
