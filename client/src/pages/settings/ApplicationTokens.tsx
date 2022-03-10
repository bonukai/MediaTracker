import React, { FunctionComponent, useState } from 'react';
import { Trans } from '@lingui/macro';
import { useTokens } from 'src/api/token';

export const SettingsApplicationTokensPage: FunctionComponent = () => {
  const { tokens, addToken, removeToken } = useTokens();
  const [tokenName, setTokenName] = useState('');

  const [newTokens, setNewTokens] = useState<Record<string, string>>({});

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const token = await addToken({ description: tokenName });
    setNewTokens({ ...newTokens, [tokenName]: token.token });

    setTokenName('');
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <input
          value={tokenName}
          onChange={(e) => setTokenName(e.currentTarget.value)}
          className="block"
          required
        />
        <button className="mt-2 btn">
          <Trans>Add token</Trans>
        </button>
      </form>

      <div className="my-4 border-t"></div>
      {tokens &&
        tokens.map((token) => (
          <div key={token} className="my-2">
            <div className="inline-block mr-2">{token}</div>
            {token in newTokens && (
              <>
                <div className="inline-block mr-2">{newTokens[token]}</div>
              </>
            )}
            <button
              className="mt-2 btn"
              onClick={() => removeToken({ description: token })}
            >
              <Trans>Remove token</Trans>
            </button>
          </div>
        ))}
    </>
  );
};
