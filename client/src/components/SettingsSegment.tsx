import React, { FunctionComponent } from 'react';

export const SettingsSegment: FunctionComponent<{
  title: string;
  href?: string;
}> = (props) => {
  const { title, href, children } = props;

  return (
    <div className="p-3 border rounded-sm">
      {href ? (
        <a className="mb-2 text-2xl font-bold underline" href={href}>
          {title}
        </a>
      ) : (
        <div className="mb-2 text-2xl font-bold">{title}</div>
      )}

      <div className="">{children}</div>
    </div>
  );
};
