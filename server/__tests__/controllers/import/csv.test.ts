import { parseCsv, CsvFileRow } from 'src/controllers/import/csv';

describe('CSV import', () => {

  test('01. Should parse valid CSV data successfully', async () => {
    const validResult: CsvFileRow = { type: 'movie', externalSrc: 'imdb', externalId: 'tt1234567', listId: undefined, watched: undefined, season: undefined, episode: undefined };

    //Unix newline terminators:
    let csvData = "type,externalSrc,externalId\nmovie,imdb,tt1234567\n";
    let result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validResult);

    //Windows newline terminators:
    csvData = `type,externalSrc,externalId\r\nmovie,imdb,tt1234567\r\n`;
    result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validResult);

    //MaxOS newline terminators:
    csvData = `type,externalSrc,externalId\rmovie,imdb,tt1234567\r`;
    result = await parseCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validResult);
  });
  
  test('02. Should throw an error if required headers are missing', async () => {
    const csvData = `externalSrc,externalId\nimdb,tt1234567\nimdb,tt0987654\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Missing required headers: "type"'
    );
  });

  test('03. Should log an error about the missing data column', async () => {
    const errMsg = 'Row length does not match headers';

    //data row is missing a column
    let csvData = `type,externalSrc,externalId\nmovie,imdb\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(errMsg);

    //Trailing comma in the header row
    csvData = `type,externalSrc,externalId,\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(errMsg);

    //Trailing comma in a data row
    csvData = `type,externalSrc,externalId\nmovie,imdb,tt1234567,\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(errMsg);

    //Completely blank row(s)
    csvData = `type,externalSrc,externalId\n\n\nmovie,imdb,tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(errMsg);
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

  test('08. Parse watched value and return a valid result', async () => {
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

  test('09. Parse listId value and return a valid result', async () => {
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

  test('10. Parse season and episode and return a valid result', async () => {
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

  test('11. Verify non-comma delimiters fail', async () => {
    //pipe delimiters fail
    let csvData = `type|externalSrc|externalId\nmovie|imdb|tt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Missing required headers: "type, externalsrc, externalid"'
    );
    //tab delimiters fail
    csvData = `type\texternalSrc\texternalId\nmovie\timdb\ttt1234567\n`;
    await expect(parseCsv(csvData)).rejects.toThrow(
      'Missing required headers: "type, externalsrc, externalid"'
    );
  });

});
