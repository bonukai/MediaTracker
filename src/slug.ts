import { customAlphabet } from 'nanoid';

export const toSlug = (str: string) => {
  return (
    str
      .toLowerCase()
      .replaceAll(/[^a-z0-9\s-]/g, '')
      .replaceAll(/\s+/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/-$/g, '')
      .replaceAll(/^-/g, '') || '-'
  );
};

export const randomSlugId = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyz',
  20
);
