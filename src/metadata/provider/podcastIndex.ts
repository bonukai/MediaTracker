// import { createHash } from 'node:crypto';
// import { z } from 'zod';

// import { metadataProviderFactory } from '../metadataProvider.js';

// const apiKey = 'UNL47N75NMTXUD852GZY';
// const apiSecret = '8PzNCS5SnQxGSeeUyjJaVDAKQBfhTKjBWhVyFznF';

// export const PodcastIndex = metadataProviderFactory({
//   name: 'podcastindex',
//   mediaType: 'podcast',
//   async search(args) {
//     if (!args.query) {
//       throw new Error(`query string is not provided`);
//     }

//     const apiHeaderTime = Math.ceil(Date.now() / 1000).toString();

//     const hash = createHash('sha1')
//       .update(`${apiKey}${apiSecret}${apiHeaderTime}`)
//       .digest('hex');

//     const res = await fetch(
//       'https://api.podcastindex.org/api/1.0/search/byterm?' +
//         new URLSearchParams({
//           q: args.query,
//         }),
//       {
//         headers: {
//           'User-Agent': 'MediaTracker',
//           'X-Auth-Key': apiKey,
//           'X-Auth-Date': apiHeaderTime,
//           Authorization: hash,
//         },
//       }
//     );

//     const data = searchResponseSchema.parse(await res.json());

//     console.log(data);

//     //   const data = searchResponseSchema.parse(
//     //     await makeApiRequest(
//     //       'games',
//     //       `fields
//     //           name,
//     //           first_release_date,
//     //           summary,
//     //           cover.image_id,
//     //           involved_companies.company.name,
//     //           involved_companies.developer,
//     //           platforms.name,
//     //           platforms.platform_logo.id,
//     //           genres.name,
//     //           platforms.id,
//     //           release_dates.date,
//     //           release_dates.platform,
//     //           websites.url;
//     //           search "${args.query}";
//     //           where version_parent = null;
//     //           limit 50;`
//     //     )
//     //   );

//     //   return data.map(mapGame);
//   },
//   async details(mediaItem): Promise<MediaItemMetadata> {
//     // if (typeof mediaItem.igdbId !== 'number') {
//     //   throw new Error(`unable to retrieve details from IGDB without igdbId`);
//     // }
//     // const data = searchResponseSchema.parse(
//     //   await makeApiRequest(
//     //     'games',
//     //     `fields
//     //         name,
//     //         first_release_date,
//     //         summary,
//     //         cover.image_id,
//     //         involved_companies.company.name,
//     //         involved_companies.developer,
//     //         platforms.name,
//     //         platforms.platform_logo.id,
//     //         genres.name,
//     //         platforms.id,
//     //         release_dates.date,
//     //         release_dates.platform,
//     //         websites.url;
//     //       where id = ${mediaItem.igdbId} & version_parent = null;`
//     //   )
//     // );
//     // const firstGameResult = data.at(0);
//     // if (!firstGameResult) {
//     //   throw new Error(`no details for ${mediaItem.igdbId} in IGDB database`);
//     // }
//     // return mapGame(firstGameResult);
//   },
// });

// const searchResponseSchema = z.object({
//   status: z.string(),
//   feeds: z.array(
//     z.object({
//       id: z.number(),
//       podcastGuid: z.string(),
//       title: z.string(),
//       url: z.string(),
//       originalUrl: z.string(),
//       link: z.string(),
//       description: z.string(),
//       author: z.string(),
//       ownerName: z.string(),
//       image: z.string(),
//       artwork: z.string(),
//       lastUpdateTime: z.number(),
//       contentType: z.string(),
//       itunesId: z.number(),
//       language: z.string(),
//       explicit: z.boolean(),
//       dead: z.number(),
//       episodeCount: z.number(),
//       //   categories: z.object({
//       //     104: z.string(),
//       //     105: z.string(),
//       //     107: z.string(),
//       //   }),
//       locked: z.number(),
//     })
//   ),
//   count: z.number(),
//   query: z.string(),
//   description: z.string(),
// });
