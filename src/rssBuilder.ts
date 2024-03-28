export const rssBuilder = (args: {
  channel: {
    title: string;
    description?: string;
    link?: string;
    lastBuildDate?: Date;
    pubDate?: Date;
    ttl?: number;
    image?: {
      url: string;
      title: string;
      link: string;
    };
  };
  items: {
    title: string;
    link?: string;
    description?: string;
    pubDate?: Date;
    guid?: string;
    enclosure?: {
      url: string;
      length: number;
      type: string;
    };
  }[];
}) => {
  const { channel, items } = args;

  const rssDocument: RssElement = {
    tagName: 'rss',
    attributes: [{ name: 'version', value: '2.0' }],
    children: [
      {
        tagName: 'channel',
        children: [
          {
            tagName: 'title',
            value: channel.title,
          },
          {
            tagName: 'description',
            value: channel.description,
          },
          {
            tagName: 'link',
            value: channel.link,
          },
          {
            tagName: 'lastBuildDate',
            value: channel.lastBuildDate?.toUTCString(),
          },
          {
            tagName: 'pubDate',
            value: channel.pubDate?.toUTCString(),
          },
          {
            tagName: 'ttl',
            value: channel.ttl?.toString(),
          },
          ...items.map(
            (item): RssElement => ({
              tagName: 'item',
              children: [
                {
                  tagName: 'title',
                  value: item.title,
                },
                {
                  tagName: 'link',
                  value: item.link,
                },
                {
                  tagName: 'description',
                  value: item.description,
                },
                {
                  tagName: 'guid',
                  value: item.guid,
                },
                {
                  tagName: 'pubDate',
                  value: item.pubDate?.toUTCString(),
                },
                {
                  tagName: 'enclosure',
                  attributes: item.enclosure
                    ? [
                        {
                          name: 'url',
                          value: item.enclosure.url,
                        },
                        {
                          name: 'length',
                          value: item.enclosure.length.toString(),
                        },
                        {
                          name: 'type',
                          value: item.enclosure.type,
                        },
                      ]
                    : undefined,
                },
              ],
            })
          ),
        ],
      },
    ],
  };

  return [
    '<?xml version="1.0"?>',
    ...stringifyRssDocument(rssDocument, 0)
      .flatMap(flattenRecursive)
      .map((item) => `${'  '.repeat(item.indentation)}${item.value}`),
  ].join('\n');
};

type RssElement = {
  tagName: string;
  attributes?: { name: string; value: string }[];
  value?: string;
  children?: RssElement[];
};

type StringifiedRssElement = {
  value?: string | StringifiedRssElement[];
  indentation: number;
};

const flattenRecursive = (
  element: StringifiedRssElement
): StringifiedRssElement[] => {
  if (Array.isArray(element.value)) {
    return element.value.flatMap(flattenRecursive);
  }

  return [element];
};

const stringifyRssDocument = (
  rssElement: RssElement,
  indentation: number
): StringifiedRssElement[] => {
  if (!rssElement.value && !rssElement.children && !rssElement.attributes) {
    return [];
  }

  const elements: StringifiedRssElement[] = [
    {
      indentation: indentation,
      value: `<${rssElement.tagName}${
        rssElement.attributes
          ?.map(
            (attribute) =>
              ` ${attribute.name}="${attribute.value
                .replaceAll('&', '&amp;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&apos;')
                .replaceAll('<', '&lt;')}"`
          )
          .join('') || ''
      }>`,
    },
    {
      indentation: indentation,
      value: rssElement.value
        ? rssElement.value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        : rssElement.children
        ? rssElement.children.flatMap((child) =>
            stringifyRssDocument(child, indentation + 1)
          )
        : '',
    },
    {
      indentation: indentation,
      value: `</${rssElement.tagName}>`,
    },
  ];

  if (rssElement.children) {
    return elements;
  } else {
    return [
      { indentation, value: elements.map((item) => item.value).join('') },
    ];
  }
};
