import { SpringConfig } from '@react-spring/core';
import { animated, Spring, Transition } from '@react-spring/web';
import { Portal } from 'src/components/Portal';
import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export type ModalArgs<T> = {
  onClosed?: (arg?: T) => void;
  onBeforeClosed?: (arg?: T) => void;
  closeOnEscape?: boolean;
  closeOnBackgroundClick?: boolean;
};

const springConfig: SpringConfig = {
  tension: 300,
  friction: 30,
};

interface OpenModalRef {
  open: () => void;
}
class OpenModalRefClass implements OpenModalRef {
  public _openModal: () => void;

  public open() {
    this._openModal && this._openModal();
  }
}

export const useOpenModalRef = () => {
  return useRef(new OpenModalRefClass() as OpenModalRef);
};

export const Modal = <ReturnType,>(props: {
  openModal?: (openModal: () => void) => JSX.Element;
  openModalRef?: React.MutableRefObject<OpenModalRef>;
  children: (closeModal: () => void) => JSX.Element;
  onClosed?: (arg?: ReturnType) => void;
  onBeforeClosed?: (arg?: ReturnType) => void;
  closeOnEscape?: boolean;
  closeOnBackgroundClick?: boolean;
}) => {
  const {
    onBeforeClosed,
    closeOnBackgroundClick,
    closeOnEscape,
    onClosed,
    openModalRef,
  } = {
    closeOnBackgroundClick: true,
    ...props,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [wasOpened, setWasOpened] = useState(false);

  const [returnedValue, setReturnValue] = useState<ReturnType>();

  const closeModal: (arg?: ReturnType) => void = useCallback(
    (arg) => {
      onBeforeClosed && onBeforeClosed(arg);
      setIsOpen(false);
      setReturnValue(arg);
    },
    [onBeforeClosed]
  );

  const openModal = () => {
    setIsOpen(true);
    setWasOpened(true);
  };

  useEffect(() => {
    if (openModalRef?.current) {
      (openModalRef.current as OpenModalRefClass)._openModal = openModal;
    }
  }, [openModalRef]);

  const mainContainerRef = useRef<HTMLDivElement>();

  const onClick: MouseEventHandler = (e) => {
    if (!closeOnBackgroundClick) {
      return;
    }

    if (mainContainerRef.current === e.target) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  };

  return (
    <>
      {props.openModal && props.openModal(openModal)}
      {wasOpened && (
        <Transition
          items={isOpen}
          from={{ opacity: 0, marginTop: -500 }}
          enter={{ opacity: 1, marginTop: 0 }}
          leave={{ opacity: 0, marginTop: -500 }}
          config={springConfig}
          reverse={isOpen}
          onRest={() => isOpen === false && onClosed && onClosed(returnedValue)}
        >
          {(transitionStyles, show) => (
            <>
              {show && (
                <Portal>
                  <Spring
                    from={{ backgroundColor: 'rgba(14,16,19,0.5)' }}
                    to={{ backgroundColor: 'rgba(14,16,19,0)' }}
                    config={springConfig}
                    reverse={isOpen}
                  >
                    {(springStyles) => (
                      <animated.div
                        style={springStyles}
                        className={
                          'fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center'
                        }
                        ref={mainContainerRef}
                        onPointerDown={onClick}
                      >
                        <animated.div
                          style={transitionStyles}
                          className="rounded bg-zinc-100 dark:bg-gray-900"
                        >
                          {props.children(closeModal)}
                        </animated.div>
                      </animated.div>
                    )}
                  </Spring>
                </Portal>
              )}
            </>
          )}
        </Transition>
      )}
    </>
  );
};
