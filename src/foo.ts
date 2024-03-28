// [ 'watchlist', 'history', 'rating', 'lists', 'listsItems' ]

// await userRepository.create({
//   name: 'bob',
//   password: '123',
// });

// console.log(
//   await mediaItemRepository.findOrCreate(
//     (await metadataProviders.searchByExternalId({
//       mediaType: 'tv',
//       ids: {
//         tmdbId: 135251,
//       },
//     }))!
//   )
// );

// console.log(await Database.knex('season').where('tvShowId', 4281))
// console.log(await Database.knex('episode').where('tvShowId', 4281))

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// bar();
// console.log(
//   await notificationPlatforms({ fetch }).sendToUser({
//     content: {
//       title: 'test',
//       body: {
//         BBCode: 'test',
//         html: 'test',
//         markdown: 'test',
//         plainText: 'test',
//       },
//     },
//     user: await userRepository.get({ userId: 1 }),
//   })
// );

// await gotify({ fetch }).sendNotification({
//   content: {
// title: 'test',
// body: {
//   BBCode: 'test',
//   html: 'test',
//   markdown: 'test',
//   plainText: 'test',
// },
//   },
//   credentials: {
//     url: 'http://10.20.40.1:9080',
//     token: 'AUlCh8DHuKY7mAB',
//     priority: 10,
//   },
// });

// console.log()

// await runMigrations();

// const harryPotter = await Database.knex('mediaItem')
//   .where('title', 'Harry Potter and the Goblet of Fire, Book 4')
//   .first();

// console.log(await OpenLibrary.searchByISBN(9780140328721));

// console.log(harryPotter);

// console.log(await Audible.details(harryPotter!));
// console.log(await IGDB.search('Lost'));
// console.log(await IGDB.details({ igdbId: 11621 }));

// await OpenLibrary.search('harry potter');
// console.log(
//   await OpenLibrary.details({
//     openlibraryId: '/works/OL82586W',
//   })
// );

// const theOffice = (await Database.knex('mediaItem')
//   .where('title', 'The Office')
//   .first())!;

// await updateMetadata(theOffice);

// await PodcastIndex.search({query: 'succession'})

// const it = await OpenLibrary.search({ query: 'it', author: 'stephen king' });
// const it = await Audible.search({ query: 'it', author: 'king' });

// console.log(it.map((item) => item.authors));

// const mediaItemsToUpdate = await Database.knex('mediaItem')
//   .where('lastTimeUpdated', '<', subDays(new Date(), 30))
//   .whereIn('source', metadataProviders.getSourceNames());

// for (const mediaItem of mediaItemsToUpdate) {
//   try {
//     await updateMetadata(mediaItem);
//   } catch (error) {
//     logger.error(error);
//   }
// }

// const getMediaItemsToDelete = async () => {
//   const deletedItems = await Database.knex.transaction(async (trx) => {
//     const mediaItemsToDelete = await trx('mediaItem')
//       .select('mediaItem.*')
//       .leftJoin('seen', 'seen.mediaItemId', 'mediaItem.id')
//       .leftJoin('userRating', 'userRating.mediaItemId', 'mediaItem.id')
//       .leftJoin('progress', 'progress.mediaItemId', 'mediaItem.id')
//       .leftJoin('listItem', 'listItem.mediaItemId', 'mediaItem.id')
//       .whereNull('seen.id')
//       .whereNull('userRating.id')
//       .whereNull('progress.id')
//       .whereNull('listItem.id');

//     const mediaItemsId = mediaItemsToDelete.map((item) => item.id);

//     const seasons = await splitWhereInQuery(mediaItemsId, (chunk) =>
//       trx('season').whereIn('tvShowId', chunk)
//     );

//     await splitWhereInQuery(mediaItemsId, (chunk) =>
//       trx('notificationsHistory').whereIn('mediaItemId', chunk).delete()
//     );

//     await splitWhereInQuery(mediaItemsId, (chunk) =>
//       trx('episode').whereIn('tvShowId', chunk).delete()
//     );

//     await splitWhereInQuery(mediaItemsId, (chunk) =>
//       trx('season').whereIn('tvShowId', chunk).delete()
//     );

//     await splitWhereInQuery(mediaItemsId, (chunk) =>
//       trx('mediaItem').whereIn('id', chunk).delete()
//     );

//     return mediaItemsToDelete;
//   });

//   if (deletedItems.length > 0) {
//     logger.info(`deleted ${deletedItems.length} mediaItems`);
//   }
// };

// await measure('clear database', () => getMediaItemsToDelete());

// console.log((await TmdbMovie.search('the prestige')).at(0));

// console.log(
//   await TmdbMovie.details({
//     tmdbId: 649609,
//   })
// );

// console.log(await TmdbMovie.findByImdbId('tt0482571'));
// console.log(await TmdbTv.search('lost'));
// console.log(await TmdbTv.details({ tmdbId: 4607 }));
// console.log(await TmdbTv.findByImdbId('tt0411008'));
// console.log(await TmdbTv.findByTvdbId(73739));

// const res = await measure('Prisma', () =>
//   listRepository.getListItems({
//     listId: 1,
//     // listId: 2,
//     userId: 1,
//   })
// );

// await measure('export database', () => exportDatabase({ userId: 1 }));

// console.log(await exportRepository.exportJson({ userId: 1 }));
// console.log(await exportRepository.exportCsv({ userId: 1 }));

// const traktExportJson = await readFile('data/trakt.json', {
//   encoding: 'utf-8',
// });

// const traktExport = traktExportSchema.parse(JSON.parse(traktExportJson));

// await importRepository.importDataByExternalIds({
//   userId: 1,
//   importData: mapToLocalImport(traktExport),
// });

// await exportRepository.exportJson({ userId: 1 });
// const z = await exportRepository.exportCsv({ userId: 1 });

// writeFileSync('test.zip', z);
