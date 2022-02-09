import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { metadataProviderCredentialsRepository } from 'src/repository/metadataProviderCredentials';
import {
  MetadataProviderCredentialsRequestType,
  metadataProviders,
  MetadataProvidersCredentialsResponseType,
} from 'src/metadata/metadataProviders';
import { onlyForAdmin } from 'src/auth';

/**
 * @openapi_tags MetadataProviderCredentials
 */
export class MetadataProviderCredentialsController {
  /**
   * @openapi_operationId get
   */
  get = createExpressRoute<{
    path: '/api/metadata-provider-credentials';
    method: 'get';
    responseBody: Partial<MetadataProvidersCredentialsResponseType>;
  }>(onlyForAdmin, async (req, res) => {
    const credentials = await metadataProviderCredentialsRepository.get();

    res.send(credentials);
  });

  /**
   * @openapi_operationId set
   */
  set = createExpressRoute<{
    path: '/api/metadata-provider-credentials';
    method: 'put';
    requestBody: MetadataProviderCredentialsRequestType;
  }>(onlyForAdmin, async (req, res) => {
    const { name, credentials } = req.body;

    await metadataProviderCredentialsRepository.delete({
      providerName: name,
    });

    await metadataProviderCredentialsRepository.createMany(
      Object.entries(credentials).map(([key, value]) => ({
        providerName: name,
        name: key,
        value: value,
      }))
    );

    await metadataProviders.loadCredentials(name);

    res.send();
  });
}
