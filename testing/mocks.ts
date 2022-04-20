import {Static} from '@micra/core/utilities/Static';

/* eslint-disable @typescript-eslint/no-empty-function */
export class MockedServiceContainer implements Micra.ServiceContainer {
  register = vi.fn();
  singleton = vi.fn();
  factory = vi.fn();
  value = vi.fn();
  use = vi.fn();
  has = vi.fn();
  clone = vi.fn();
  on = vi.fn();
  emit = vi.fn();
  emitSync = vi.fn();
  static with(partial: Micra.ServiceContainer): Static<Micra.ServiceContainer> {
    return class ExtendedMockedServiceContainer extends MockedServiceContainer {
      constructor() {
        super();
        Object.assign(this, partial);
      }
    };
  }
}

export class MockedServiceProvider implements Micra.ServiceProvider {
  register = vi.fn();
  boot = vi.fn();
  static with(partial: Micra.ServiceProvider): Static<Micra.ServiceProvider> {
    return class ExtendedMockedServiceProvider extends MockedServiceProvider {
      constructor() {
        super();
        Object.assign(this, partial);
      }
    };
  }
}

export class MockedAsyncServiceProvider implements Micra.ServiceProvider {
  register = vi.fn(async () => {});
  boot = vi.fn(async () => {});
  static with(partial: Micra.ServiceProvider): Static<Micra.ServiceProvider> {
    return class ExtendedMockedAsyncServiceProvider extends MockedAsyncServiceProvider {
      constructor() {
        super();
        Object.assign(this, partial);
      }
    };
  }
}

export class MockedAsyncKernel implements Micra.Kernel {
  run = vi.fn(async () => {});
  boot = vi.fn(async () => {});
  static with(partial: Micra.Kernel): Static<Micra.Kernel> {
    return class ExtendedMockedAsyncKernel extends MockedAsyncKernel {
      constructor() {
        super();
        Object.assign(this, partial);
      }
    };
  }
}

export class MockedKernel implements Micra.Kernel {
  run = vi.fn();
  boot = vi.fn();
  static with(partial: Micra.Kernel): Static<Micra.Kernel> {
    return class ExtendedMockedKernel extends MockedKernel {
      constructor() {
        super();
        Object.assign(this, partial);
      }
    };
  }
}
