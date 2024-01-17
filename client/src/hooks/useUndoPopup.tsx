import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useTransition, animated } from '@react-spring/web';
import { Trans } from '@lingui/macro';
import { randomId } from '../utils';
import { createPortal } from 'react-dom';
import { Button } from '../components/Button';

type PopupArguments = {
  content: React.JSX.Element;
  action: () => void | Promise<void>;
};

const UndoContext = createContext<{
  addPopup: (args: PopupArguments) => void;
} | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useUndoPopup = () => {
  const context = useContext(UndoContext);

  if (!context) {
    throw new Error(`UndoContext is not set`);
  }

  return context;
};

type ItemType = PopupArguments & { id: string; createdAt: Date };

export const UndoProvider: FC<PropsWithChildren> = ({ children }) => {
  const refMap = useMemo(() => new WeakMap<ItemType, HTMLDivElement>(), []);
  const [data, setData] = useState<ItemType[]>([]);

  const removePopup = useCallback((id: string) => {
    setData((values) => [...values.filter((item) => item.id !== id)]);
  }, []);

  const addPopup = useCallback((args: PopupArguments) => {
    const id = randomId();
    setData((value) => [...value, { ...args, id: id, createdAt: new Date() }]);
    setTimeout(
      () => setData((values) => [...values.filter((item) => item.id !== id)]),
      10000
    );
  }, []);

  const transitions = useTransition(data, {
    keys: (item) => item.id,
    from: { opacity: 0, height: 0, translate: '0px', life: 100 },
    enter: (item) => async (next) => {
      await next({ opacity: 1, height: refMap.get(item)?.offsetHeight });
    },
    leave: () => [
      {
        translate: '1000px',
      },
      { height: 0 },
    ],
    config: {
      tension: 200,
      friction: 25,
    },
  });

  return (
    <UndoContext.Provider value={{ addPopup }}>
      {children}
      {createPortal(
        <div className="fixed bottom-0 right-0 z-40 flex flex-col items-end justify-end m-2 align-bottom md:m-4">
          {transitions((style, item) => (
            <animated.div style={style}>
              <div
                key={item.id}
                ref={(ref) => ref && refMap.set(item, ref)}
                className="pt-2 "
              >
                <UndoComponent
                  popup={item}
                  dismiss={() => removePopup(item.id)}
                />
              </div>
            </animated.div>
          ))}
        </div>,
        document.body
      )}
    </UndoContext.Provider>
  );
};

const UndoComponent: FC<{
  popup: PopupArguments;
  dismiss: () => void;
}> = ({ popup, dismiss }) => {
  const { action, content } = popup;
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenUsed, setHasBeenUsed] = useState(false);

  return (
    <div className="flex flex-row items-center gap-2 p-2 mr-auto rounded bg-slate-400 w-fit">
      <div>{content}</div>
      <Button
        preventDefault
        onClick={async () => {
          setIsLoading(true);
          await action();
          setIsLoading(false);
          setHasBeenUsed(true);
          dismiss();
        }}
        isLoading={isLoading}
      >
        {isLoading && <>...</>}
        <Trans>Undo</Trans>
      </Button>
    </div>
  );
};
