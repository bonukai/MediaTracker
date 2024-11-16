import { parseCsv } from 'src/controllers/import/csv';

describe('CSV import', () => {

  test('01. Should parse valid CSV data successfully', async () => {
    const csvData = "type,externalSrc,externalId\nmovie,imdb,tt1234567\n";

    const result = await parseCsv(csvData);
    //console.log(result);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'movie',
      externalSrc: 'imdb',
      externalId: 'tt1234567',
      listId: undefined,
      watched: undefined,
      season: undefined,
      episode: undefined
    });

  });
  
  test('02. Should throw an error if required headers are missing', async () => {
    const csvData = `externalSrc,externalId\nimdb,tt1234567\nimdb,tt0987654\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Missing required headers: type'
    );
  });

  test('03. Should log an error about the missing data column', async () => {
    //data row is missing a column
    const csvData = `type,externalSrc,externalId\nmovie,imdb\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Row length does not match headers'
    );
  });

  test('04. Should log an error that "show" is an invalid type', async () => {
    //data row is missing a column
    const csvData = `type,externalSrc,externalId\nshow,tvdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Invalid type value: "show"'
    );
  });

  test('05. Should log an error that "fakedb" is an invalid externalSrc', async () => {
    //data row is missing a column
    const csvData = `type,externalSrc,externalId\nmovie,fakedb,12345678\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Invalid externalSrc value: "fakedb"'
    );
  });

  test('06. Should log an error that type "movie" cant use externalSrc "tvdb"', async () => {
    //cant use audible with a movie
    const csvData = `type,externalSrc,externalId\nmovie,tvdb,1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Invalid type and externalSrc combination: "movie", "tvdb"'
    );
  });

  test('07. Should log an error about the blank data column', async () => {
    //Mandatory column is present, but is empty
    const csvData = `type,externalSrc,externalId\nmovie,imdb,\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Invalid externalId value: ""'
    );
  });

  test('08. Should fail on blank rows', async () => {
    const csvData = `type,externalSrc,externalId\n\n\n\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Row length does not match headers'
    );
  });

  test('09. Parse watched value and return a valid result', async () => {
    const csvData = `type,externalSrc,externalId,watched\nmovie,imdb,tt1234567,Y\n`;
    const result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'movie',
      externalSrc: 'imdb',
      externalId: 'tt1234567',
      listId: undefined,
      watched: 'Y',
      season: undefined,
      episode: undefined
    });
  });

  test('10. Parse listId value and return a valid result', async () => {
    const csvData = `type,externalSrc,externalId,listId\nmovie,imdb,tt1234567,2\n`;
    const result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'movie',
      externalSrc: 'imdb',
      externalId: 'tt1234567',
      listId: 2,
      watched: undefined,
      season: undefined,
      episode: undefined
    });
  });

  test('11. Parse watched value and return a valid result', async () => {
    const csvData = `type,externalSrc,externalId,watched\nmovie,imdb,tt1234567,Y\n`;
    const result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'movie',
      externalSrc: 'imdb',
      externalId: 'tt1234567',
      listId: undefined,
      watched: 'Y',
      season: undefined,
      episode: undefined
    });
  });

  test('12. Parse season and episode and return a valid result', async () => {
    const csvData = `type,externalSrc,externalId,watched,season,episode\nmovie,imdb,tt1234567,Y,2,3\n`;
    const result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'movie',
      externalSrc: 'imdb',
      externalId: 'tt1234567',
      listId: undefined,
      watched: 'Y',
      season: 2,
      episode: 3
    });
  });

});
