import { toSlug } from 'src/slug';

describe('slug', () => {
  test('should remove special characters', () => {
    expect(toSlug(` !"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`)).toBe('-');
  });

  test('should remove unicode characters', () => {
    expect(
      toSlug(
        `ⳡ▴Ⰵ⦦↖Ⰰ⥸ⶽ⇶⧌∣⎨ⵒ⅗⼾⏷⚝⏐␏⫅⿎⦙⩺⒪≥≷▃⎝∶⤸⚂ⷺⅨⳅ⣹⬭⃖✪➄⤁⤿⹑⻝⮵ⶥ⾑⤢ⷁ☐⸱ₛ⮒⧺␁⌥ⴼ⬎⩴†⽅┒⥖⮺⣙⮌ⵃ⍸✥⢐⟭⽻ⷮⓝⵡ❁⼽➂⼧⹡⒦⏓⦌‛⣁⡞⻍₵⧺⃪⽶Ⲡ⿘✇⪀⛥ⴴ⼻⏔┡ⷴ`
      )
    ).toBe('-');
  });

  test('should remove leading dash', () => {
    expect(toSlug('-slug')).toBe('slug');
  });

  test('should remove trailing dash', () => {
    expect(toSlug('slug-')).toBe('slug');
  });

  test('should remove leading and trailing dash', () => {
    expect(toSlug('-slug-')).toBe('slug');
  });

  test('should return "-" for empty string', () => {
    expect(toSlug('')).toBe('-');
  });

  test('should return "-" for "-"', () => {
    expect(toSlug('-')).toBe('-');
  });

  test('should return "-" for "--"', () => {
    expect(toSlug('--')).toBe('-');
  });

  test('should replace special characters in the middle', () => {
    expect(toSlug('-t.e!*s(*)(t-')).toBe('test');
  });
});
