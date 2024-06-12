export const promiseWithResolvers = <T>() => {
  let resolveTmp!: (value: T) => void;
  let rejectTmp!: () => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveTmp = resolve;
    rejectTmp = reject;
  });

  return {
    promise,
    resolve: resolveTmp,
    reject: rejectTmp,
  };
};
