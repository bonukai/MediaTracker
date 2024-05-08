import { PropsWithChildren } from 'react';

export const Accent = (props: PropsWithChildren) => {
  const { children } = props;
  return <span className="font-semibold text-pink-600">{children}</span>;
};
