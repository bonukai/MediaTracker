import { useEffect, useState } from 'react';

export const useFonts = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await document.fonts.ready;
      setLoaded(true);
    })();
  }, []);

  return {
    loaded: loaded,
  };
};
