import { useEffect, useState } from 'react';

export const useImg = (src?: string | null) => {
  const [hasImage, setHasImage] = useState<boolean>();

  useEffect(() => {
    if (!src) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const maxAttempts = 5;

    const fetchImage = async (attempt: number, retryIn: number) => {
      if (attempt > maxAttempts) {
        return;
      }

      const res = await fetch(src);

      if (res.ok) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setHasImage(true);
        };
      } else {
        setHasImage(false);

        timeoutId = setTimeout(async () => {
          await fetchImage(attempt + 1, retryIn * 4);
        }, retryIn);
      }
    };

    fetchImage(1, 100);

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const loading = hasImage === undefined ? false : !hasImage;
  const showPlaceholder =
    typeof src === 'string'
      ? hasImage === undefined
        ? false
        : !hasImage
      : true;

  return {
    hasImage: typeof src === 'string',
    src: hasImage ? src : undefined,
    loading,
    showPlaceholder,
  };
};
