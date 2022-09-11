type GlobalThis = Window & typeof globalThis;
export const getGlobal = (): GlobalThis => {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return window;
  }

  if (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  ) {
    return global as GlobalThis;
  }

  if (
    typeof self === 'object' &&
    self.constructor &&
    self.constructor.name === 'DedicatedWorkerGlobalScope'
  ) {
    return self;
  }

  if (typeof globalThis !== 'undefined') {
    return globalThis as GlobalThis;
  }

  throw new Error(`Unable to find global object`);
};
