import type {Static} from '@micra/core/utilities/static';

export const isClass = <T>(clazz: Static<T> | T): T => {
  try {
    return new (clazz as Static<T>)();
  } catch (err) {
    if ((err as Error).message.indexOf('is not a constructor') >= 0) {
      return clazz as T;
    } else {
      throw err;
    }
  }
};
