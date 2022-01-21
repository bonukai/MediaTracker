import urljoin from 'url-join';
import axios from 'axios';

import { ExternalIds, MediaItemForProvider } from 'src/entity/mediaItem';
import { metadataProvider } from 'src/metadata/metadataProvider';
import { RequestQueue } from 'src/requestQueue';

const getPosterUrl = (path: string, size: CoverSize = 't_original') => {
    return urljoin(
        'https://images.igdb.com/igdb/image/upload/',
        size,
        path + '.jpg'
    );
};

export class IGDB extends metadataProvider({
    name: 'IGDB',
    mediaType: 'video_game',
    credentialNames: <const>['CLIENT_ID', 'CLIENT_SECRET'],
}) {
    public async search(query: string): Promise<MediaItemForProvider[]> {
        const result = await this.searchGames(query);

        return Promise.all(result.map((item) => this.mapGame(item)));
    }

    async details(mediaItem: ExternalIds): Promise<MediaItemForProvider> {
        const result = await this.game(mediaItem.igdbId);
        return result ? this.mapGame(result) : null;
    }

    private mapGame(searchResult: Game): MediaItemForProvider {
        return {
            needsDetails: false,
            source: this.name,
            mediaType: this.mediaType,
            igdbId: searchResult.id,
            releaseDate: searchResult.first_release_date
                ? new Date(searchResult.first_release_date * 1000).toISOString()
                : null,
            title: searchResult.name,
            overview: searchResult.summary,
            poster: searchResult.cover
                ? getPosterUrl(searchResult.cover.image_id)
                : null,
            genres: searchResult.genres
                ? searchResult.genres.map((genre) => genre.name)
                : null,
            url:
                searchResult.websites?.length > 0
                    ? searchResult.websites[0].url
                    : null,
            developer: searchResult.involved_companies?.find(
                (item) => item.developer
            )?.company.name,
        };
    }

    private async game(gameId: number) {
        const res = (await this.get(
            'games',
            `fields 
        *, 
        cover.image_id, 
        platforms.name, 
        platforms.platform_logo.id, 
        genres.name, 
        collection.*, 
        franchises.*, 
        websites.*; 
      where id = ${gameId} & version_parent = null;`
        )) as Game[];
        if (res.length > 0) {
            return res[0];
        }
    }

    private async searchGames(query: string) {
        return (await this.get(
            'games',
            `fields 
        *, 
        cover.image_id, 
        involved_companies.company.name, 
        involved_companies.developer, 
        platforms.platform_logo.image_id, 
        genres.name, 
        websites.*; 
      search "${query}"; 
      where version_parent = null; 
      limit 50;`
        )) as Game[];
    }

    private async get(endpoint: string, query: string) {
        await this.refreshToken();

        const result = await this.requestQueue.request(() =>
            axios.post(urljoin('https://api.igdb.com/v4/', endpoint), query, {
                headers: {
                    Authorization: 'Bearer ' + this.token.access_token,
                    'Client-ID': this.credentials.CLIENT_ID,
                },
            })
        );

        return result.data;
    }

    private async refreshToken() {
        if (
            this.tokenAcquiredAt?.getTime() + this.token?.expires_in * 1000 >
            new Date().getTime()
        ) {
            return;
        }

        const result = await this.requestQueue.request(() =>
            axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.credentials.CLIENT_ID,
                    client_secret: this.credentials.CLIENT_SECRET,
                    grant_type: 'client_credentials',
                },
            })
        );

        if (result.status === 200) {
            this.token = result.data as Token;
            this.tokenAcquiredAt = new Date();
        }
    }

    private token: Token;
    private tokenAcquiredAt: Date;
    private readonly requestQueue = new RequestQueue({
        timeBetweenRequests: 250,
    });
}

interface Token {
    access_token: string;
    expires_in: number;
    token_type: string;
}

interface Game {
    id: number;
    age_ratings?: number[];
    aggregated_rating?: number;
    aggregated_rating_count?: number;
    alternative_names?: number[];
    artworks?: number[];
    category: number;
    collection?: Collection;
    cover?: Image;
    created_at: number;
    expansions?: number[];
    external_games?: number[];
    first_release_date?: number;
    follows?: number;
    franchises?: Franchise[];
    game_engines?: number[];
    game_modes?: number[];
    genres?: Genre[];
    hypes?: number;
    involved_companies?: InvolvedCompany[];
    keywords?: number[];
    name: string;
    platforms?: Platform[];
    player_perspectives?: number[];
    rating?: number;
    rating_count?: number;
    release_dates?: number[];
    screenshots?: number[];
    similar_games?: number[];
    slug: string;
    storyline?: string;
    summary?: string;
    tags?: number[];
    themes?: number[];
    total_rating?: number;
    total_rating_count?: number;
    updated_at: number;
    url: string;
    videos?: number[];
    websites?: Website[];
    checksum: string;
    version_parent?: number;
    version_title?: string;
    parent_game?: number;
}

interface Platform {
    id: number;
    abbreviation: string;
    alternative_name?: string;
    category: number;
    created_at: number;
    name: string;
    platform_logo: Image;
    slug: string;
    updated_at: number;
    url: string;
    versions: number[];
    websites: number[];
    checksum: string;
    generation?: number;
    platform_family?: number;
    summary?: string;
}

interface Genre {
    id: number;
    created_at: number;
    name: string;
    slug: string;
    updated_at: number;
    url: string;
    checksum: string;
}

interface Image {
    id: number;
    alpha_channel: boolean;
    animated: boolean;
    game: number;
    height: number;
    image_id: string;
    url: string;
    width: number;
    checksum: string;
}

interface Collection {
    id: number;
    created_at: number;
    games: number[];
    name: string;
    slug: string;
    updated_at: number;
    url: string;
    checksum: string;
}

interface Franchise {
    id: number;
    created_at: number;
    games: number[];
    name: string;
    slug: string;
    updated_at: number;
    url: string;
    checksum: string;
}

interface InvolvedCompany {
    id: number;
    company: Company;
    created_at: number;
    developer: boolean;
    game: number;
    porting: boolean;
    publisher: boolean;
    supporting: boolean;
    updated_at: number;
    checksum: string;
}

interface Company {
    id: number;
    change_date_category: number;
    country: number;
    created_at: number;
    description?: string;
    developed?: number[];
    logo?: number;
    name: string;
    parent?: number;
    published?: number[];
    slug: string;
    start_date?: number;
    start_date_category: number;
    updated_at: number;
    url: string;
    websites?: number[];
    checksum: string;
}

interface Website {
    id: number;
    category: number;
    game: number;
    trusted: boolean;
    url: string;
    checksum: string;
}

type CoverSize =
    | 't_cover_big'
    | 't_thumb'
    | 't_720p'
    | 't_1080p'
    | 't_original';
