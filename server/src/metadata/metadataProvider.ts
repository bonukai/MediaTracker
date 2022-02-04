import _ from 'lodash';

import {
    ExternalIds,
    MediaItemForProvider,
    MediaType,
} from 'src/entity/mediaItem';
import { metadataProviderCredentialsRepository } from 'src/repository/metadataProviderCredentials';

export abstract class MetadataProvider {
    async findByImdbId(imdbId: string): Promise<MediaItemForProvider> {
        throw new Error('Not implemented');
    }

    async findByTmdbId(tmdbId: number): Promise<MediaItemForProvider> {
        throw new Error('Not implemented');
    }

    /**
     * Search for media
     * @param query
     */
    public abstract search(query: string): Promise<MediaItemForProvider[]>;

    /**
     * Get details for media.
     * @param mediaItem MediaItem
     */
    abstract details(ids: ExternalIds): Promise<MediaItemForProvider>;
}

export const metadataProvider = <
    Name extends string = string,
    CredentialNames extends ReadonlyArray<string> = []
>(args: {
    name: Name;
    mediaType: MediaType;
    credentialNames?: CredentialNames;
}) => {
    abstract class _MetadataProvider extends MetadataProvider {
        public readonly name = args.name;
        public readonly mediaType = args.mediaType;
        public readonly credentialNames = args.credentialNames;

        private _credentials: Record<CredentialNames[number], string>;

        protected get credentials() {
            return this._credentials;
        }

        async loadCredentials() {
            if (!this.credentialNames) {
                return;
            }
            const keys = await metadataProviderCredentialsRepository.find({
                providerName: this.name,
            });

            this._credentials = _(keys)
                .keyBy((value) => value.name)
                .mapValues((value) => value.value)
                .value() as Record<CredentialNames[number], string>;
        }

        hasCredentials() {
            return (
                this.credentialNames?.length ===
                Object.keys(this.credentials).length
            );
        }
    }

    return _MetadataProvider;
};
