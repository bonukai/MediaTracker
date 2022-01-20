import React, { FunctionComponent } from 'react';
import { useConfiguration } from 'src/api/configuration';
import { CheckboxWithTitleAndDescription } from 'src/components/Checkbox';

export const SettingsConfigurationPage: FunctionComponent = () => {
  const { configuration, update, isLoading } = useConfiguration();

  return (
    <>
      {isLoading ? (
        <></>
      ) : (
        <CheckboxWithTitleAndDescription
          title="Enable registration"
          checked={configuration.enableRegistration}
          onChange={(value) => update({ enableRegistration: value })}
        />
      )}
    </>
  );
};
