import { SpringConfig, useSpring, animated } from '@react-spring/web';
import React, {
  FC,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils';

const springConfig: SpringConfig = {
  tension: 300,
  friction: 30,
};

const DialogPropsContext = createContext<
  { isOpen: boolean; close: () => void } | undefined
>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useDialogProps = () => {
  const value = useContext(DialogPropsContext);

  if (!value) {
    throw new Error(`Provider for DialogPropsContext has not been set`);
  }

  return value;
};

export const Dialog: FC<{
  isOpen: boolean;
  close: () => void;
  children: React.JSX.Element;
}> = ({ isOpen, children, close }) => {
  const [wasOpened, setWasOpened] = useState<boolean>(isOpen);

  const popupStyle = useSpring({
    from: {
      marginTop: `-500px`,
      opacity: 0,
    },
    to: {
      marginTop: `0px`,
      opacity: 1,
    },
    onRest: () => {
      if (!isOpen && wasOpened) {
        setWasOpened(false);
      }
    },
    reverse: !isOpen,
    config: springConfig,
  });

  const overlayStyle = useSpring({
    from: {
      backgroundColor: 'rgba(14,16,19,0)',
    },
    to: {
      backgroundColor: 'rgba(14,16,19,0.5)',
    },
    reverse: !isOpen,
    config: springConfig,
  });

  useEffect(() => {
    if (!wasOpened && isOpen) {
      setWasOpened(true);
    }
  }, [isOpen, wasOpened]);

  return (
    <>
      {wasOpened &&
        createPortal(
          <animated.div
            className={cx(
              'z-20 fixed top-0 bottom-0 left-0 right-0  bg-slate-400'
            )}
            style={overlayStyle}
          >
            <div className="relative flex justify-center w-full h-full">
              <div className="flex flex-col items-center justify-center h-full ">
                <animated.div
                  className="p-4 m-2 bg-white rounded top-10"
                  style={popupStyle}
                >
                  <DialogPropsContext.Provider
                    value={{
                      close,
                      isOpen,
                    }}
                  >
                    {children}
                  </DialogPropsContext.Provider>
                </animated.div>
              </div>
            </div>
          </animated.div>,
          document.body
        )}
    </>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const dialogActionFactory = <T,>(
  DialogContent: FC<T & { closeDialog: () => void }>
): FC<{ children: React.JSX.Element } & T> => {
  return (props) => {
    const { children } = props;
    const [isOpen, setIsOpen] = useState(false);
    const closeDialog = () => setIsOpen(false);

    return (
      <>
        {React.cloneElement(children, {
          onClick: () => setIsOpen(true),
        })}

        <Dialog isOpen={isOpen} close={closeDialog}>
          <DialogContent closeDialog={closeDialog} {...props} />
        </Dialog>
      </>
    );
  };
};
