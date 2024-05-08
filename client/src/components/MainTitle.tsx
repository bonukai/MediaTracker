import { FC, Fragment, ReactNode } from 'react';
import { ChevronRightIcon } from './Icons';

export const MainTitle: FC<{ children?: ReactNode; elements?: ReactNode[] }> = (
  props
) => {
  const { children } = props;
  const elements = props.elements?.filter(Boolean);

  return (
    <div className="mb-8 text-[#222F4A] text-[36px] font-semibold font-[Inter] flex items-center border-b-[#EEEEEE] border-b-[1px]">
      <span className="w-1 h-8 bg-[#fb8500] mr-2 rounded-sm"></span>
      {children}

      <div className="flex items-center">
        {elements?.map((child, index) => (
          <Fragment key={index}>
            {index < elements.length && index > 0 && (
              <ChevronRightIcon className="fill-[#fb8500]" />
            )}
            {child}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
