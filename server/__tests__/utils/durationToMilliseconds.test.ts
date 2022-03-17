import { durationToMilliseconds } from 'src/utils';

describe('durationToMilliseconds', () => {
  test('durationToMilliseconds', async () => {
    const dayToMilliseconds = 24 * 60 * 60 * 1000;
    const hourToMilliseconds = 60 * 60 * 1000;
    const minuteToMilliseconds = 60 * 1000;
    const secondToMilliseconds = 1000;

    expect(
      durationToMilliseconds({
        days: 1,
        hours: 2,
        minutes: 3,
        seconds: 4,
      })
    ).toBe(
      1 * dayToMilliseconds +
        2 * hourToMilliseconds +
        3 * minuteToMilliseconds +
        4 * secondToMilliseconds
    );
  });
});
