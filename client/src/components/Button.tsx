import { FC, ReactNode, cloneElement, useRef, useState } from 'react';
import { cx } from '../utils';
import { secondsToMilliseconds } from 'date-fns';

type TooltipArgs = {
  position: 'top' | 'bottom' | 'left' | 'right';
  content: ReactNode;
};
type OnClickReturnType = {
  showTooltip: TooltipArgs;
} | void;

const circleBorderWidth = 8;
const circleRadius = 30;
const tooltipTimeout = secondsToMilliseconds(2);

export const Button: FC<{
  actionType?: 'button' | 'reset' | 'submit';
  type?: 'primary' | 'secondary';
  isLoading?: boolean;
  text?: React.JSX.Element;
  icon?: React.JSX.Element;
  children?: ReactNode;
  className?: string;
  onClick?: () => Promise<OnClickReturnType> | OnClickReturnType;
  color?: 'green' | 'red';
  preventDefault?: true;
  multiline?: boolean;
}> = (props) => {
  const {
    actionType,
    isLoading,
    text,
    icon,
    className,
    onClick,
    children,
    preventDefault,
    multiline,
  } = props;

  const color = props.color || 'green';
  const type = props.type || 'primary';

  const [tooltip, setTooltip] = useState<TooltipArgs>();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <button
      type={actionType}
      className={cx(
        className,
        isLoading && '!bg-opacity-40 !text-opacity-20 !cursor-progress',
        'relative duration-100 transition-all leading-none tracking-wide rounded select-none hover:cursor-pointer focus:outline-none text-[14px]',
        icon && text && 'flex items-center justify-center gap-1',
        multiline !== true && 'whitespace-pre',
        type === 'primary' &&
          cx(
            'font-medium p-2',
            color === 'green' && 'bg-teal-100 text-teal-950',
            // color === 'green' && 'bg-sky-200 text-sky-900',
            // color === 'green' && 'bg-[#c5eae7] text-[#00201f]',
            color === 'red' && 'bg-rose-200 text-rose-900'
          ),
        type === 'secondary' &&
          cx(
            'font-semibold my-2',
            color === 'green' && 'text-teal-800',
            color === 'red' && 'text-rose-600'
          )
      )}
      onClick={async (e) => {
        if (preventDefault) {
          e.preventDefault();
        }

        if (isLoading) {
          return;
        }

        if (onClick) {
          const res = await onClick();

          if (!res) {
            return;
          }

          if (res.showTooltip) {
            setTooltip(res.showTooltip);

            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }

            tooltipTimeoutRef.current = setTimeout(
              () => setTooltip(undefined),
              tooltipTimeout
            );
          }
        }
      }}
    >
      {children ? (
        <>{children}</>
      ) : (
        <>
          {icon &&
            cloneElement(icon, {
              className: cx(
                'h-[14px] fill-current w-min text-current',
                icon.props.className
              ),
            })}

          {text && <>{icon ? <div>{text}</div> : <>{text}</>}</>}
        </>
      )}

      {isLoading && (
        <div className="absolute top-0 bottom-0 left-0 right-0 z-20 ">
          <svg
            className="animate-spin"
            style={{
              width: '100%',
              height: '100%',
            }}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={circleRadius}
              stroke="#e5e7eb"
              strokeWidth={circleBorderWidth}
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r={circleRadius}
              stroke="#2563eb"
              strokeWidth={circleBorderWidth}
              strokeDasharray={circleRadius * 2 * Math.PI * 0.75}
              fill="none"
            />
          </svg>
        </div>
      )}

      {tooltip && (
        <>
          <div
            onClick={(e) => e.stopPropagation()}
            className={cx(
              'absolute !cursor-default w-2 h-2 bg-gray-800 rotate-45 z-20',
              tooltip.position === 'bottom' && 'top-full mt-1',
              tooltip.position === 'top' && 'top-0 -mt-1 -translate-y-full',
              tooltip.position === 'left' && 'right-full mx-1',
              tooltip.position === 'right' && 'left-full mx-1'
            )}
          ></div>
          <div
            onClick={(e) => e.stopPropagation()}
            className={cx(
              'absolute !cursor-default px-2 py-1 bg-gray-800 rounded text-slate-100 z-20',
              tooltip.position === 'bottom' && 'top-full mt-2',
              tooltip.position === 'top' && 'top-0 -mt-2 -translate-y-full',
              tooltip.position === 'left' && 'right-full mx-2',
              tooltip.position === 'right' && 'left-full mx-2'
            )}
          >
            {tooltip.content}
          </div>
        </>
      )}
    </button>
  );
};
