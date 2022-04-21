import type {Static} from '@micra/core/utilities/static';

export const getInstanceOf = <T>(clazz: Static<T> | T): T => {
  try {
    return new (clazz as Static<T>)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (
      err &&
      typeof err === 'object' &&
      err.message.indexOf('is not a constructor') >= 0
    ) {
      return clazz as T;
    } else {
      throw err;
    }
  }
};
