import _ from 'lodash';

import { MetadataProviderCredentials } from 'src/entity/metadataProviderCredentials';
import { MetadataProvidersCredentialsResponseType } from 'src/metadata/metadataProviders';
import { repository } from 'src/repository/repository';

class MetadataProviderCredentialsRepository extends repository<MetadataProviderCredentials>(
    {
        tableName: 'metadataProviderCredentials',
        primaryColumnName: 'id',
    }
) {
    public async get(): Promise<
        Partial<MetadataProvidersCredentialsResponseType>
    > {
        const credentials = await this.find();

        return _(credentials)
            .groupBy((value) => value.providerName)
            .mapValues((value) =>
                _(value)
                    .keyBy((value) => value.name)
                    .mapValues((value) => value.value)
                    .value()
            )
            .value();
    }
}

export const metadataProviderCredentialsRepository =
    new MetadataProviderCredentialsRepository();
