import { AccessToken } from 'src/entity/accessToken';
import { Configuration } from 'src/entity/configuration';
import { MediaItemBase } from 'src/entity/mediaItem';
import { NotificationPlatformsCredentials } from 'src/entity/notificationPlatformsCredentials';
import { NotificationsHistory } from 'src/entity/notificationsHistory';
import { Seen } from 'src/entity/seen';
import { TvEpisode } from 'src/entity/tvepisode';
import { TvSeason } from 'src/entity/tvseason';
import { User } from 'src/entity/user';
import { UserRating } from 'src/entity/userRating';
import { Watchlist } from 'src/entity/watchlist';

export class InitialData {
    static user: User = {
        id: 1,
        name: 'admin',
        admin: true,
        password: 'password',
        publicReviews: false,
    };

    static accessToken: AccessToken = {
        id: 1,
        userId: this.user.id,
        description: 'token',
        token: 'token',
    };

    static mediaItem: MediaItemBase = {
        id: 1,
        lastTimeUpdated: new Date().getTime(),
        mediaType: 'tv',
        source: 'user',
        title: 'title',
    };

    static season: TvSeason = {
        id: 1,
        description: 'description',
        releaseDate: '2001-02-20',
        tvShowId: this.mediaItem.id,
        title: 'title',
        seasonNumber: 1,
        numberOfEpisodes: 1,
        isSpecialSeason: false,
    };

    static episode: TvEpisode = {
        id: 1,
        episodeNumber: 1,
        seasonId: this.season.id,
        tvShowId: this.mediaItem.id,
        isSpecialEpisode: false,
        seasonNumber: 1,
        title: 'Episode 1',
        releaseDate: '2001-02-20',
        seasonAndEpisodeNumber: 1001,
    };

    static watchlist: Watchlist = {
        id: 1,
        userId: this.user.id,
        mediaItemId: this.mediaItem.id,
    };

    static userRating: UserRating = {
        id: 1,
        mediaItemId: this.mediaItem.id,
        date: new Date().getTime(),
        userId: this.user.id,
        rating: 4,
        review: 'review',
    };

    static userRating2: UserRating = {
        id: 2,
        mediaItemId: this.mediaItem.id,
        date: new Date().getTime(),
        userId: this.user.id,
        rating: 3,
        review: 'review2',
        seasonId: this.season.id,
    };

    static userRating3: UserRating = {
        id: 3,
        mediaItemId: this.mediaItem.id,
        date: new Date().getTime(),
        userId: this.user.id,
        rating: 5,
        review: 'review3',
        episodeId: this.episode.id,
    };

    static seen: Seen = {
        id: 1,
        date: new Date().getTime(),
        mediaItemId: this.mediaItem.id,
        seasonId: this.season.id,
        episodeId: this.episode.id,
        userId: this.user.id,
    };

    static notificationPlatformsCredentials: NotificationPlatformsCredentials = {
        id: 1,
        name: 'key',
        platformName: 'platform',
        userId: this.user.id,
        value: 'value',
    };

    static notificationsHistory: NotificationsHistory = {
        id: 1,
        mediaItemId: this.mediaItem.id,
        episodeId: this.episode.id,
        sendDate: new Date().getTime(),
    };

    static configuration: Configuration = {
        id: 1,
        enableRegistration: true,
    };
}
