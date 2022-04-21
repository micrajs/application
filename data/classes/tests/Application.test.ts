/* eslint-disable @typescript-eslint/no-empty-function */
import {MockEnvironment} from '@micra/core-test-utils/environment';
import {
  MockServiceContainer,
  MockServiceProvider,
  MockAsyncServiceProvider,
  MockAsyncKernel,
  MockKernel,
} from '@micra/core-test-utils/index.mjs';
import {Application} from '../Application';

declare global {
  namespace Application {
    interface Services {
      foo: 'bar';
    }
    interface Configurations {
      foo: {
        bar: string;
      };
    }
    interface EnvironmentVariables {
      foo: 'bar';
    }
  }
}

describe('Application tests', () => {
  const globalSelf = globalThis as typeof globalThis & {
    use?: Micra.Use;
    env?: Micra.Env;
    config?: Micra.Config;
    app?: Micra.Application;
  };

  beforeEach((): void => {
    if (globalSelf.use) {
      delete globalSelf.use;
    }
    if (globalSelf.env) {
      delete globalSelf.env;
    }
    if (globalSelf.config) {
      delete globalSelf.config;
    }
    if (globalSelf.app) {
      delete globalSelf.app;
    }
  });

  describe('Application.initializeProviders tests', () => {
    it('should call register method on providers', async () => {
      const application = new Application();
      const ServiceProvider = new MockAsyncServiceProvider();

      await application.initializeProviders({ServiceProvider});

      expect(ServiceProvider.register).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.register).toHaveBeenCalledWith(application);
    });

    it('should call boot method on providers', async () => {
      const application = new Application();
      const ServiceProvider = new MockAsyncServiceProvider();

      await application.initializeProviders({ServiceProvider});

      expect(ServiceProvider.boot).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate a providers', async () => {
      const application = new Application();
      const register = vi.fn(async () => {});
      const boot = vi.fn(async () => {});
      const ServiceProvider = MockAsyncServiceProvider.with({register, boot});

      await application.initializeProviders({ServiceProvider});

      expect(boot).toHaveBeenCalledTimes(1);
      expect(boot).toHaveBeenCalledWith(application);
      expect(register).toHaveBeenCalledTimes(1);
      expect(register).toHaveBeenCalledWith(application);
    });

    it('should add providers to the serviceProviders list', async () => {
      const application = new Application();
      const ServiceProvider = new MockAsyncServiceProvider();

      await application.initializeProviders({ServiceProvider});

      expect(application.serviceProviders[0]).toBe(ServiceProvider);
    });

    it('should add an instance of providers to the serviceProviders list', async () => {
      const application = new Application();
      const register = vi.fn(async () => {});
      const boot = vi.fn(async () => {});
      const ServiceProvider = MockAsyncServiceProvider.with({register, boot});

      await application.initializeProviders({ServiceProvider});

      expect(application.serviceProviders[0]).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('Application.initializeProvidersSync tests', () => {
    it('should call register method on providers synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProvidersSync({ServiceProvider});

      expect(ServiceProvider.register).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.register).toHaveBeenCalledWith(application);
    });

    it('should call boot method on providers synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProvidersSync({ServiceProvider});

      expect(ServiceProvider.boot).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate a providers synchronously', () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const ServiceProvider = MockServiceProvider.with({register, boot});

      application.initializeProvidersSync({ServiceProvider});

      expect(boot).toHaveBeenCalledTimes(1);
      expect(boot).toHaveBeenCalledWith(application);
      expect(register).toHaveBeenCalledTimes(1);
      expect(register).toHaveBeenCalledWith(application);
    });

    it('should add providers to the serviceProviders list synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProvidersSync({ServiceProvider});

      expect(application.serviceProviders[0]).toBe(ServiceProvider);
    });

    it('should add an instance of providers to the serviceProviders list synchronously', () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const ServiceProvider = MockServiceProvider.with({register, boot});

      application.initializeProvidersSync({ServiceProvider});

      expect(application.serviceProviders[0]).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('Application.start tests', () => {
    it('should the willStart event to have been emitted', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should only start the application once', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      await application.start();
      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not create the app global helper', async () => {
      const application = new Application();

      await application.start();

      expect(globalSelf.app).not.toBeDefined();
    });

    it('should create the app global helper', async () => {
      const application = new Application();

      await application.start({
        globals: {app: true},
      });

      expect(globalSelf.app).toBeDefined();
    });

    it('should set the application instance to the global scope', async () => {
      const application = new Application();

      await application.start({
        globals: {app: true},
      });

      expect(globalSelf.app).toBe(application);
    });

    it('should emit the willInitializeContainer event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeContainer', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a service container', async () => {
      const application = new Application();

      await application.start({
        container: MockServiceContainer,
      });

      expect(application.container).toBeInstanceOf(MockServiceContainer);
    });

    it('should create the use global helper', async () => {
      const application = new Application();

      await application.start();

      expect(globalSelf.use).toBeDefined();
    });

    it("should call the use method on the application's service container", async () => {
      const application = new Application();
      await application.start({
        container: MockServiceContainer,
      });

      globalSelf.use?.('foo');

      expect(application.container.use).toHaveBeenCalledTimes(1);
      expect(application.container.use).toHaveBeenCalledWith('foo');
    });

    it('should not create the use global helper', async () => {
      const application = new Application();

      await application.start({
        globals: {use: false},
      });

      expect(globalSelf.use).not.toBeDefined();
    });

    it('should emit the didInitializeContainer event with the service container', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeContainer', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.container);
    });

    it('should emit the willInitializeEnvironments event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeEnvironments', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should instantiate environments', async () => {
      const application = new Application();
      const environments = {
        mocked: MockEnvironment,
      };

      await application.start({
        environments,
      });

      expect(application.environment.envs[0]).toBeInstanceOf(MockEnvironment);
    });

    it('should initialize environments', async () => {
      const application = new Application();
      const environments = {
        mocked: new MockEnvironment(),
      };

      await application.start({
        environments,
      });

      expect(environments.mocked.init).toHaveBeenCalled();
    });

    it('should create the env global helper', async () => {
      const application = new Application();

      await application.start();

      expect(globalSelf.env).toBeDefined();
    });

    it('should return an environment variable from a given source', async () => {
      const application = new Application();
      const mocked = new MockEnvironment();
      mocked.has.mockImplementation((key: string) => key === 'foo');
      mocked.get.mockImplementation((key: string) =>
        key === 'foo' ? 'bar' : undefined,
      );
      await application.start({
        environments: {mocked},
      });

      const value = globalSelf.env?.('foo');

      expect(mocked.get).toHaveBeenCalledWith('foo', undefined);
      expect(value).toBe('bar');
    });

    it('should not create the env global helper', async () => {
      const application = new Application();

      await application.start({
        globals: {env: false},
      });

      expect(globalSelf.env).not.toBeDefined();
    });

    it('should emit the didInitializeEnvironments event with the environment', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeEnvironments', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.environment);
    });

    it('should emit the willInitializeConfigurations event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeConfigurations', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a given configuration', async () => {
      const application = new Application();

      await application.start({
        configurations: {
          foo: {
            bar: 'baz',
          },
        },
      });

      expect(application.configuration.get('foo.bar')).toBe('baz');
    });

    it('should instantiate a given configuration class', async () => {
      const application = new Application();

      await application.start({
        configurations: {
          foo: class FooConfiguration {
            bar = 'baz';
          },
        },
      });

      expect(application.configuration.get('foo.bar')).toBe('baz');
    });

    it('should create the config global helper', async () => {
      const application = new Application();

      await application.start();

      expect(globalSelf.config).toBeDefined();
    });

    it('should retrieve a given config value from the application', async () => {
      const application = new Application();
      await application.start({
        configurations: {
          foo: {
            bar: 'baz',
          },
        },
      });

      const value = globalSelf.config?.('foo.bar');

      expect(value).toBe('baz');
    });

    it('should not create the config global helper', async () => {
      const application = new Application();

      await application.start({
        globals: {config: false},
      });

      expect(globalSelf.config).not.toBeDefined();
    });

    it('should emit the didInitializeConfigurations event with the configurations', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeConfigurations', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.configuration);
    });

    it('should emit the willInitializeProviders event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeProviders', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize providers', async () => {
      const application = new Application();
      const providers = {
        mocked: new MockAsyncServiceProvider(),
      };

      await application.start({
        providers,
      });

      expect(providers.mocked.boot).toHaveBeenCalledWith(application);
      expect(providers.mocked.register).toHaveBeenCalledWith(application);
    });

    it('should add providers to service providers list', async () => {
      const application = new Application();
      const providers = {
        mocked: new MockAsyncServiceProvider(),
      };

      await application.start({
        providers,
      });

      expect(application.serviceProviders[0]).toBe(providers.mocked);
    });

    it('should instantiate and initialize providers', async () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const providers = {
        mocked: MockAsyncServiceProvider.with({register, boot}),
      };

      await application.start({
        providers,
      });

      expect(boot).toHaveBeenCalledWith(application);
      expect(register).toHaveBeenCalledWith(application);
    });

    it('should instantiate and add providers to service providers list', async () => {
      const application = new Application();
      const providers = {
        mocked: MockAsyncServiceProvider,
      };

      await application.start({
        providers,
      });

      expect(application.serviceProviders[0]).toBeInstanceOf(
        MockAsyncServiceProvider,
      );
    });

    it('should emit the didInitializeProviders event with the service providers', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeProviders', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.serviceProviders);
    });

    it('should emit the willInitializeKernel event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeKernel', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a kernel with itself', async () => {
      const application = new Application();
      const kernel = new MockAsyncKernel();

      await application.start({
        kernel,
      });

      expect(kernel.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate and initialize a kernel with itself', async () => {
      const application = new Application();
      const boot = vi.fn();
      const kernel = MockAsyncKernel.with({boot});

      await application.start({
        kernel,
      });

      expect(boot).toHaveBeenCalledWith(application);
    });

    it('should emit the didInitializeKernel event with the service providers', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeKernel', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.kernel);
    });

    it('should emit the didStart event', async () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didStart', spy);

      await application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Application.startSync tests', () => {
    it('should the willStart event to have been emitted', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should only start the application once', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      application.startSync();
      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not create the app global helper', () => {
      const application = new Application();

      application.startSync();

      expect(globalSelf.app).not.toBeDefined();
    });

    it('should create the app global helper', () => {
      const application = new Application();

      application.startSync({
        globals: {app: true},
      });

      expect(globalSelf.app).toBeDefined();
    });

    it('should set the application instance to the global scope', () => {
      const application = new Application();

      application.startSync({
        globals: {app: true},
      });

      expect(globalSelf.app).toBe(application);
    });

    it('should emit the willInitializeContainer event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeContainer', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a service container', () => {
      const application = new Application();

      application.startSync({
        container: MockServiceContainer,
      });

      expect(application.container).toBeInstanceOf(MockServiceContainer);
    });

    it('should create the use global helper', () => {
      const application = new Application();

      application.startSync();

      expect(globalSelf.use).toBeDefined();
    });

    it("should call the use method on the application's service container", () => {
      const application = new Application();
      application.startSync({
        container: MockServiceContainer,
      });

      globalSelf.use?.('foo');

      expect(application.container.use).toHaveBeenCalledTimes(1);
      expect(application.container.use).toHaveBeenCalledWith('foo');
    });

    it('should not create the use global helper', () => {
      const application = new Application();

      application.startSync({
        globals: {use: false},
      });

      expect(globalSelf.use).not.toBeDefined();
    });

    it('should emit the didInitializeContainer event with the service container', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeContainer', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.container);
    });

    it('should emit the willInitializeEnvironments event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeEnvironments', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should instantiate environments', () => {
      const application = new Application();
      const environments = {
        mocked: MockEnvironment,
      };

      application.startSync({
        environments,
      });

      expect(application.environment.envs[0]).toBeInstanceOf(MockEnvironment);
    });

    it('should initialize environments', () => {
      const application = new Application();
      const environments = {
        mocked: new MockEnvironment(),
      };

      application.startSync({
        environments,
      });

      expect(environments.mocked.initSync).toHaveBeenCalled();
    });

    it('should create the env global helper', () => {
      const application = new Application();

      application.startSync();

      expect(globalSelf.env).toBeDefined();
    });

    it('should return an environment variable from a given source', () => {
      const application = new Application();
      const mocked = new MockEnvironment();
      mocked.has.mockImplementation((key: string) => key === 'foo');
      mocked.get.mockImplementation((key: string) =>
        key === 'foo' ? 'bar' : undefined,
      );
      application.startSync({
        environments: {mocked},
      });

      const value = globalSelf.env?.('foo');

      expect(mocked.get).toHaveBeenCalledWith('foo', undefined);
      expect(value).toBe('bar');
    });

    it('should not create the env global helper', () => {
      const application = new Application();

      application.startSync({
        globals: {env: false},
      });

      expect(globalSelf.env).not.toBeDefined();
    });

    it('should emit the didInitializeEnvironments event with the environment', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeEnvironments', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.environment);
    });

    it('should emit the willInitializeConfigurations event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeConfigurations', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a given configuration', () => {
      const application = new Application();

      application.startSync({
        configurations: {
          foo: {
            bar: 'baz',
          },
        },
      });

      expect(application.configuration.get('foo.bar')).toBe('baz');
    });

    it('should instantiate a given configuration class', () => {
      const application = new Application();

      application.startSync({
        configurations: {
          foo: class FooConfiguration {
            bar = 'baz';
          },
        },
      });

      expect(application.configuration.get('foo.bar')).toBe('baz');
    });

    it('should create the config global helper', () => {
      const application = new Application();

      application.startSync();

      expect(globalSelf.config).toBeDefined();
    });

    it('should retrieve a given config value from the application', () => {
      const application = new Application();
      application.startSync({
        configurations: {
          foo: {
            bar: 'baz',
          },
        },
      });

      const value = globalSelf.config?.('foo.bar');

      expect(value).toBe('baz');
    });

    it('should not create the config global helper', () => {
      const application = new Application();

      application.startSync({
        globals: {config: false},
      });

      expect(globalSelf.config).not.toBeDefined();
    });

    it('should emit the didInitializeConfigurations event with the configurations', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeConfigurations', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.configuration);
    });

    it('should emit the willInitializeProviders event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeProviders', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize providers', () => {
      const application = new Application();
      const providers = {
        mocked: new MockServiceProvider(),
      };

      application.startSync({
        providers,
      });

      expect(providers.mocked.boot).toHaveBeenCalledWith(application);
      expect(providers.mocked.register).toHaveBeenCalledWith(application);
    });

    it('should add providers to service providers list', () => {
      const application = new Application();
      const providers = {
        mocked: new MockServiceProvider(),
      };

      application.startSync({
        providers,
      });

      expect(application.serviceProviders[0]).toBe(providers.mocked);
    });

    it('should instantiate and initialize providers', () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const providers = {
        mocked: MockServiceProvider.with({register, boot}),
      };

      application.startSync({
        providers,
      });

      expect(boot).toHaveBeenCalledWith(application);
      expect(register).toHaveBeenCalledWith(application);
    });

    it('should instantiate and add providers to service providers list', () => {
      const application = new Application();
      const providers = {
        mocked: MockServiceProvider,
      };

      application.startSync({
        providers,
      });

      expect(application.serviceProviders[0]).toBeInstanceOf(
        MockServiceProvider,
      );
    });

    it('should emit the didInitializeProviders event with the service providers', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeProviders', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.serviceProviders);
    });

    it('should emit the willInitializeKernel event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeKernel', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a kernel with itself', () => {
      const application = new Application();
      const kernel = new MockKernel();

      application.startSync({
        kernel,
      });

      expect(kernel.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate and initialize a kernel with itself', () => {
      const application = new Application();
      const boot = vi.fn();
      const kernel = MockKernel.with({boot});

      application.startSync({
        kernel,
      });

      expect(boot).toHaveBeenCalledWith(application);
    });

    it('should emit the didInitializeKernel event with the service providers', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeKernel', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.kernel);
    });

    it('should emit the didStart event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didStart', spy);

      application.startSync();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
