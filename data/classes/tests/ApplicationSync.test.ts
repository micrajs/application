/* eslint-disable @typescript-eslint/no-empty-function */
import {MockEnvironment} from '@micra/core-test-utils/environment';
import {MockKernel} from '@micra/core-test-utils/kernel';
import {MockServiceContainer} from '@micra/core-test-utils/service-container';
import {MockServiceProvider} from '@micra/core-test-utils/service-provider';
import {ApplicationSync as Application} from '../ApplicationSync';

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
    it('should call register method on providers synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProviders({ServiceProvider});

      expect(ServiceProvider.register).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.register).toHaveBeenCalledWith(application);
    });

    it('should call boot method on providers synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProviders({ServiceProvider});

      expect(ServiceProvider.boot).toHaveBeenCalledTimes(1);
      expect(ServiceProvider.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate a providers synchronously', () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const ServiceProvider = MockServiceProvider.with({register, boot});

      application.initializeProviders({ServiceProvider});

      expect(boot).toHaveBeenCalledTimes(1);
      expect(boot).toHaveBeenCalledWith(application);
      expect(register).toHaveBeenCalledTimes(1);
      expect(register).toHaveBeenCalledWith(application);
    });

    it('should add providers to the serviceProviders list synchronously', () => {
      const application = new Application();
      const ServiceProvider = new MockServiceProvider();

      application.initializeProviders({ServiceProvider});

      expect(application.serviceProviders[0]).toBe(ServiceProvider);
    });

    it('should add an instance of providers to the serviceProviders list synchronously', () => {
      const application = new Application();
      const register = vi.fn();
      const boot = vi.fn();
      const ServiceProvider = MockServiceProvider.with({register, boot});

      application.initializeProviders({ServiceProvider});

      expect(application.serviceProviders[0]).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('Application.start tests', () => {
    it('should the willStart event to have been emitted', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should only start the application once', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willStart', spy);

      application.start();
      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not create the app global helper', () => {
      const application = new Application();

      application.start();

      expect(globalSelf.app).not.toBeDefined();
    });

    it('should create the app global helper', () => {
      const application = new Application();

      application.start({
        globals: {app: true},
      });

      expect(globalSelf.app).toBeDefined();
    });

    it('should set the application instance to the global scope', () => {
      const application = new Application();

      application.start({
        globals: {app: true},
      });

      expect(globalSelf.app).toBe(application);
    });

    it('should emit the willInitializeContainer event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeContainer', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a service container', () => {
      const application = new Application();

      application.start({
        container: MockServiceContainer,
      });

      expect(application.container).toBeInstanceOf(MockServiceContainer);
    });

    it('should create the use global helper', () => {
      const application = new Application();

      application.start();

      expect(globalSelf.use).toBeDefined();
    });

    it("should call the use method on the application's service container", () => {
      const application = new Application();
      application.start({
        container: MockServiceContainer,
      });

      globalSelf.use?.('foo');

      expect(application.container.use).toHaveBeenCalledTimes(1);
      expect(application.container.use).toHaveBeenCalledWith('foo');
    });

    it('should not create the use global helper', () => {
      const application = new Application();

      application.start({
        globals: {use: false},
      });

      expect(globalSelf.use).not.toBeDefined();
    });

    it('should emit the didInitializeContainer event with the service container', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeContainer', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.container);
    });

    it('should emit the willInitializeEnvironments event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeEnvironments', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should instantiate environments', () => {
      const application = new Application();
      const environments = {
        mocked: MockEnvironment,
      };

      application.start({
        environments,
      });

      expect(application.environment.envs[0]).toBeInstanceOf(MockEnvironment);
    });

    it('should initialize environments', () => {
      const application = new Application();
      const environments = {
        mocked: new MockEnvironment(),
      };

      application.start({
        environments,
      });

      expect(environments.mocked.initSync).toHaveBeenCalled();
    });

    it('should create the env global helper', () => {
      const application = new Application();

      application.start();

      expect(globalSelf.env).toBeDefined();
    });

    it('should return an environment variable from a given source', () => {
      const application = new Application();
      const mocked = new MockEnvironment();
      mocked.has.mockImplementation((key: string) => key === 'foo');
      mocked.get.mockImplementation((key: string) =>
        key === 'foo' ? 'bar' : undefined,
      );
      application.start({
        environments: {mocked},
      });

      const value = globalSelf.env?.('foo');

      expect(mocked.get).toHaveBeenCalledWith('foo', undefined);
      expect(value).toBe('bar');
    });

    it('should not create the env global helper', () => {
      const application = new Application();

      application.start({
        globals: {env: false},
      });

      expect(globalSelf.env).not.toBeDefined();
    });

    it('should emit the didInitializeEnvironments event with the environment', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeEnvironments', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.environment);
    });

    it('should emit the willInitializeConfigurations event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeConfigurations', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a given configuration', () => {
      const application = new Application();

      application.start({
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

      application.start({
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

      application.start();

      expect(globalSelf.config).toBeDefined();
    });

    it('should retrieve a given config value from the application', () => {
      const application = new Application();
      application.start({
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

      application.start({
        globals: {config: false},
      });

      expect(globalSelf.config).not.toBeDefined();
    });

    it('should emit the didInitializeConfigurations event with the configurations', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeConfigurations', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.configuration);
    });

    it('should emit the willInitializeProviders event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeProviders', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize providers', () => {
      const application = new Application();
      const providers = {
        mocked: new MockServiceProvider(),
      };

      application.start({
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

      application.start({
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

      application.start({
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

      application.start({
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

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.serviceProviders);
    });

    it('should emit the willInitializeKernel event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('willInitializeKernel', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should initialize a kernel with itself', () => {
      const application = new Application();
      const kernel = new MockKernel();

      application.start({
        kernel,
      });

      expect(kernel.boot).toHaveBeenCalledWith(application);
    });

    it('should instantiate and initialize a kernel with itself', () => {
      const application = new Application();
      const boot = vi.fn();
      const kernel = MockKernel.with({boot});

      application.start({
        kernel,
      });

      expect(boot).toHaveBeenCalledWith(application);
    });

    it('should emit the didInitializeKernel event with the service providers', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didInitializeKernel', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(application.kernel);
    });

    it('should emit the didStart event', () => {
      const spy = vi.fn();
      const application = new Application();
      application.on('didStart', spy);

      application.start();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
