import { formatNotification } from 'src/notifications/notificationFormatter';
import { generateExternalUrl } from 'src/utils';

describe('notificationFormatter', () => {
  test('should format plain text', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'tv',
        source: 'user',
        title: 'title',
      })
    ).toBeUndefined();

    expect(formatNotification(() => 'plain text')).toEqual({
      plainText: 'plain text',
      markdown: 'plain text',
      html: 'plain text',
      BBCode: 'plain text',
    });
  });

  test('should format plain text in template literals', async () => {
    expect(formatNotification(() => `plain text ${1}`)).toEqual({
      plainText: 'plain text 1',
      markdown: 'plain text 1',
      html: 'plain text 1',
      BBCode: 'plain text 1',
    });
  });

  test('should format bold text', async () => {
    expect(formatNotification((f) => `start ${f.bold('bold')} end`)).toEqual({
      plainText: 'start bold end',
      markdown: 'start **bold** end',
      html: 'start <b>bold</b> end',
      BBCode: 'start [b]bold[/b] end',
    });
  });

  test('should format italic text', async () => {
    expect(
      formatNotification((f) => `start ${f.italic('italic')} end`)
    ).toEqual({
      plainText: 'start italic end',
      markdown: 'start *italic* end',
      html: 'start <em>italic</em> end',
      BBCode: 'start [i]italic[/i] end',
    });
  });

  test('should format url', async () => {
    expect(
      formatNotification((f) => `start ${f.url('title', 'url')} end`)
    ).toEqual({
      plainText: 'start title end',
      markdown: 'start [title](url) end',
      html: 'start <a href="url">title</a> end',
      BBCode: 'start [url=url]title[/url] end',
    });
  });

  test('should format italic and url inside bold text', async () => {
    expect(
      formatNotification(
        (f) =>
          `start ${f.bold(
            `${f.italic('italic')} bold ${f.url('title', 'url')}`
          )} end`
      )
    ).toEqual({
      plainText: 'start italic bold title end',
      markdown: 'start ***italic* bold [title](url)** end',
      html: 'start <b><em>italic</em> bold <a href="url">title</a></b> end',
      BBCode: 'start [b][i]italic[/i] bold [url=url]title[/url][/b] end',
    });
  });

  test('should format media item external url', async () => {
    expect(
      formatNotification(
        (f) =>
          `start ${f.mediaItemUrl({
            mediaType: 'tv',
            source: 'user',
            title: 'Lost',
            imdbId: 'tt0411008',
          })} end`
      )
    ).toEqual({
      plainText: 'start Lost end',
      markdown: 'start **[Lost](https://www.imdb.com/title/tt0411008)** end',
      html: 'start <b><a href="https://www.imdb.com/title/tt0411008">Lost</a></b> end',
      BBCode:
        'start [b][url=https://www.imdb.com/title/tt0411008]Lost[/url][/b] end',
    });
  });
});
