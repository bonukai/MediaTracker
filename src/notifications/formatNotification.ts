import { MediaItemModel } from '../entity/mediaItemModel.js';
import { generateExternalUrl } from '../utils.js';

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
    mediaItemUrl: (mediaItem: MediaItemModel) => string;
  }) => string
): FormattedNotification => {
  return {
    plainText: fn({
      bold: (message: string) => message,
      url: (message: string, _: string) => message,
      italic: (message: string) => message,
      mediaItemUrl: (mediaItem: MediaItemModel) => mediaItem.title,
    }),
    markdown: fn({
      bold: (message: string) => `**${message}**`,
      url: (message: string, url: string) => `[${message}](${url})`,
      italic: (message: string) => `*${message}*`,
      mediaItemUrl: (mediaItem: MediaItemModel) =>
        `**[${mediaItem.title}](${generateExternalUrl(mediaItem)})**`,
    }),
    html: fn({
      bold: (message: string) => `<b>${message}</b>`,
      url: (message: string, url: string) => `<a href="${url}">${message}</a>`,
      italic: (message: string) => `<em>${message}</em>`,
      mediaItemUrl: (mediaItem: MediaItemModel) =>
        `<b><a href="${generateExternalUrl(mediaItem)}">${
          mediaItem.title
        }</a></b>`,
    }),
    BBCode: fn({
      bold: (message: string) => `[b]${message}[/b]`,
      url: (message: string, url: string) => `[url=${url}]${message}[/url]`,
      italic: (message: string) => `[i]${message}[/i]`,
      mediaItemUrl: (mediaItem: MediaItemModel) =>
        `[b][url=${generateExternalUrl(mediaItem)}]${
          mediaItem.title
        }[/url][/b]`,
    }),
  };
};
