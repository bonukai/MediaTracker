import { useMemo } from 'react';

export const useTranslatedKeysFactory = <
  Key extends string,
  Translation extends string = string
>(
  arg: Record<Key, Translation>
) => {
  return useMemo(() => {
    const translations = Object.values(arg) as Translation[];
    const keys = Object.keys(arg) as Key[];
    const entries = Object.entries(arg) as [Key, Translation][];

    const translationToKeyMap = Object.fromEntries(
      Object.entries(arg).map(([key, value]) => [value, key])
    );

    const translationToKey = (translation: Translation) =>
      translationToKeyMap[translation] as Key;

    const keyToTranslation = (key: Key) => arg[key];

    const map = <T>(callback: (key: Key, translation: Translation) => T) => {
      return Object.entries(arg).map(([key, translation]: [Key, Translation]) =>
        callback(key, translation)
      );
    };

    return {
      translations,
      keys,
      entries,
      translationToKey,
      keyToTranslation,
      map,
    };
  }, [arg]);
};
