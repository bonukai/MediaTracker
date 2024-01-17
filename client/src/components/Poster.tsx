import type { MediaItemResponse } from '@server/entity/mediaItemModel';
import { FC, useEffect, useRef, useState } from 'react';
import { cx } from '../utils';
import { posterAspectRatio, posterSrc } from '../mediaItemHelpers';

export const Poster: FC<{
  mediaItem: MediaItemResponse;
  width?: number;
  roundedCorners?: 'all' | 'left' | 'top';
  className?: string;
}> = (props) => {
  const { mediaItem, width, className } = props;
  const roundedCorners = props.roundedCorners || 'all';
  const src = posterSrc(mediaItem, width);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageCachedRef = useRef<boolean | null>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const elementRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>();

  if (src) {
    imgRef.current.src = src;

    if (imageCachedRef.current === null && imgRef.current.naturalHeight > 0) {
      imageCachedRef.current = true;
    } else {
      imageCachedRef.current = false;
    }
  }

  useEffect(() => {
    if (!elementRef.current) {
      throw new Error(`missing ref`);
    }

    setFontSize((elementRef.current.offsetHeight / 3) * 2);
  }, []);

  return (
    <div
      ref={elementRef}
      className={cx(
        'relative w-full antialiased ',
        posterAspectRatio(mediaItem),
        className
      )}
    >
      {/* <div
        className={cx(
          'absolute top-0 left-0 flex flex-row items-center justify-center w-full h-full antialiased text-center text-red-700 align-middle  bg-orange-200 select-none overflow-clip',
          roundedCorners === 'all'
            ? 'rounded'
            : roundedCorners === 'top'
            ? 'rounded-t'
            : roundedCorners === 'left'
            ? 'rounded-t'
            : '',
          imageCachedRef.current === false &&
            (imageLoaded ? 'opacity-0' : 'opacity-100')
        )}
        style={{
          fontSize: fontSize ? `${fontSize}px` : '',
        }}
      >
        ?
      </div>

      {src && (
        <img
          src={src}
          ref={imgRef}
          draggable="false"
          onLoad={() => setImageLoaded(true)}
          className={cx(
            'antialiased absolute top-0 left-0 w-full h-full shadow-md object-fill overflow-clip z-10',
            roundedCorners === 'all'
              ? 'rounded'
              : roundedCorners === 'top'
              ? 'rounded-t'
              : roundedCorners === 'left'
              ? 'rounded-l'
              : '',
            imageCachedRef.current === false &&
              (imageLoaded ? 'opacity-100' : 'opacity-0 blur-xl'),
            className
          )}
        />
      )} */}

      {src ? (
        <img
          src={src}
          ref={imgRef}
          draggable="false"
          onLoad={() => setImageLoaded(true)}
          className={cx(
            'antialiased absolute top-0 left-0 w-full h-full shadow-md object-fill overflow-clip z-10',
            roundedCorners === 'all'
              ? 'rounded'
              : roundedCorners === 'top'
                ? 'rounded-t'
                : roundedCorners === 'left'
                  ? 'rounded-l'
                  : '',
            imageCachedRef.current === false &&
              (imageLoaded ? 'opacity-100' : 'opacity-0 blur-xl'),
            className
          )}
        />
      ) : (
        <div
          className={cx(
            'absolute top-0 left-0 flex flex-row items-center justify-center w-full h-full antialiased text-center text-red-700 align-middle  bg-orange-200 select-none overflow-clip',
            roundedCorners === 'all'
              ? 'rounded'
              : roundedCorners === 'top'
                ? 'rounded-t'
                : roundedCorners === 'left'
                  ? 'rounded-t'
                  : '',
            imageCachedRef.current === false &&
              (imageLoaded ? 'opacity-0' : 'opacity-100')
          )}
          style={{
            fontSize: fontSize ? `${fontSize}px` : '',
          }}
        >
          ?
        </div>
      )}
    </div>
  );
};
