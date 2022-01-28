import { MetadataProviderCredentials } from 'mediatracker-api';
import React, { FunctionComponent, useEffect, useRef } from 'react';
import { useMetadataProviderCredentials } from 'src/api/metadataProviderCredentials';
import { SettingsSegment } from 'src/components/SettingsSegment';

export const SettingsMetadataProviderCredentialsPage: FunctionComponent =
  () => {
    return (
      <MetadataProviderCredentialsBaseComponent providerName="IGDB">
        <a
          href="https://api-docs.igdb.com/#account-creation"
          className="block mb-2 underline"
        >
          API keys cen be acquired here
        </a>
        <label>
          Client ID
          <input className="block mb-2" name="CLIENT_ID" />
        </label>
        <label>
          Client Secret
          <input className="block" name="CLIENT_SECRET" />
        </label>
      </MetadataProviderCredentialsBaseComponent>
    );
  };

const MetadataProviderCredentialsBaseComponent: FunctionComponent<{
  providerName: string;
}> = (props) => {
  const { providerName, children } = props;

  const { metadataProviderCredentials, setMetadataProviderCredentials } =
    useMetadataProviderCredentials();

  const formRef = useRef<HTMLFormElement>();

  useEffect(() => {
    if (
      formRef.current &&
      metadataProviderCredentials &&
      metadataProviderCredentials[providerName]
    ) {
      formRef.current.querySelectorAll('input').forEach((input) => {
        if (
          input.name in metadataProviderCredentials[providerName] &&
          !input.value
        ) {
          input.value = metadataProviderCredentials[providerName][input.name];
        }
      });
    }
  }, [providerName, metadataProviderCredentials]);

  return (
    <SettingsSegment title={providerName}>
      <div>
        <form
          ref={formRef}
          className="pb-2"
          onSubmit={(e) => {
            e.preventDefault();

            const credentials = Object.fromEntries(
              new FormData(e.currentTarget).entries()
            );

            setMetadataProviderCredentials({
              name: providerName,
              credentials: credentials,
            } as MetadataProviderCredentials.Set.RequestBody);
          }}
        >
          {children}
          <button className="block mt-2 btn">Save</button>
        </form>
      </div>
    </SettingsSegment>
  );
};