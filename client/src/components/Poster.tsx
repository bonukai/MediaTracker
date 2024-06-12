import type { MediaItemResponse } from '@server/entity/mediaItemModel';
import { FC, createContext, useEffect, useRef, useState } from 'react';
import { cx } from '../utils';
import { posterAspectRatio, posterSrc } from '../mediaItemHelpers';
import { useImg } from '../hooks/useImg';
import { t } from '@lingui/macro';

export const Poster: FC<{
  mediaItem: MediaItemResponse;
  width?: number;
  roundedCorners?: 'all' | 'left' | 'top';
  className?: string;
}> = (props) => {
  const { mediaItem, width, className, roundedCorners } = props;

  return (
    <Img
      aspectRatio={posterAspectRatio(mediaItem)}
      src={posterSrc(mediaItem, width)}
      className={className}
      roundedCorners={roundedCorners}
      alt={t`"${mediaItem.title}" poster`}
    />
  );
};

export const Img: FC<{
  src?: string | null;
  width?: number;
  roundedCorners?: 'all' | 'left' | 'top';
  className?: string;
  aspectRatio?: string;
  alt: string;
}> = (props) => {
  const { className, aspectRatio, alt } = props;
  const roundedCorners = props.roundedCorners || 'all';
  const imgRef = useRef<HTMLImageElement>(new Image());
  const elementRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>();

  const { src, loading, showPlaceholder } = useImg(props.src);

  useEffect(() => {
    if (!elementRef.current) {
      throw new Error(`missing ref`);
    }

    setFontSize((elementRef.current.offsetHeight / 3) * 2);
  }, []);

  return (
    <div
      ref={elementRef}
      className={cx('relative antialiased w-full', className)}
      style={
        aspectRatio
          ? {
              aspectRatio: aspectRatio,
            }
          : {}
      }
    >
      {!loading && src ? (
        <img
          alt={alt}
          src={src}
          ref={imgRef}
          draggable="false"
          className={cx(
            'antialiased absolute top-0 left-0 w-full h-full shadow-md object-fill overflow-clip z-10',
            roundedCorners === 'all'
              ? 'rounded'
              : roundedCorners === 'top'
                ? 'rounded-t'
                : roundedCorners === 'left'
                  ? 'rounded-l'
                  : '',

            !loading ? 'opacity-100' : 'opacity-0 blur-xl',
            className
          )}
        />
      ) : (
        <div
          className={cx(
            'absolute top-0 left-0 flex flex-row items-center justify-center w-full h-full antialiased text-center  align-middle  select-none overflow-clip',
            showPlaceholder && 'text-red-700 bg-orange-200',
            roundedCorners === 'all'
              ? 'rounded'
              : roundedCorners === 'top'
                ? 'rounded-t'
                : roundedCorners === 'left'
                  ? 'rounded-t'
                  : '',

            !showPlaceholder ? 'opacity-0' : 'opacity-100'
          )}
          style={{
            fontSize: fontSize ? `${fontSize}px` : '',
          }}
        >
          {showPlaceholder && <>?</>}
        </div>
      )}
    </div>
  );
};
