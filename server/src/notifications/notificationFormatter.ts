import { MediaItemBase } from 'src/entity/mediaItem';
import { generateExternalUrl } from 'src/utils';

export type FormattedNotification = {
  plainText: string;
  markdown: string;
  html: string;
  BBCode: string;
};
export const formatNotification = (
  fn: (formatters: {
    bold: (message: string) => string;
    url: (message: string, url: string) => string;
    italic: (message: string) => string;
    mediaItemUrl: (mediaItem: MediaItemBase) => string;
  }) => string
): FormattedNotification => {
  return {
    plainText: fn({
      bold: (message: string) => message,
      url: (message: string, url: string) => message,
      italic: (message: string) => message,
      mediaItemUrl: (mediaItem: MediaItemBase) => mediaItem.title,
    }),
    markdown: fn({
      bold: (message: string) => `**${message}**`,
      url: (message: string, url: string) => `[${message}](${url})`,
      italic: (message: string) => `*${message}*`,
      mediaItemUrl: (mediaItem: MediaItemBase) =>
        `**[${mediaItem.title}](${generateExternalUrl(mediaItem)})**`,
    }),
    html: fn({
      bold: (message: string) => `<b>${message}</b>`,
      url: (message: string, url: string) => `<a href="${url}">${message}</a>`,
      italic: (message: string) => `<em>${message}</em>`,
      mediaItemUrl: (mediaItem: MediaItemBase) =>
        `<b><a href="${generateExternalUrl(mediaItem)}">${
          mediaItem.title
        }</a></b>`,
    }),
    BBCode: fn({
      bold: (message: string) => `[b]${message}[/b]`,
      url: (message: string, url: string) => `[url=${url}]${message}[/url]`,
      italic: (message: string) => `[i]${message}[/i]`,
      mediaItemUrl: (mediaItem: MediaItemBase) =>
        `[b][url=${generateExternalUrl(mediaItem)}]${
          mediaItem.title
        }[/url][/b]`,
    }),
  };
};
