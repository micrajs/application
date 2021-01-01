import { Config } from '@micra/config';
import { MultiEnv } from '@micra/multi-env';
import {
  Application as ApplicationContract,
  Config as ConfigContract,
  Kernel,
  ServiceContainer,
  ServiceProvider,
  StaticEnvironment,
  StaticKernel,
  StaticServiceContainer,
  StaticServiceProvider,
} from '@micra/core';

export class Application implements ApplicationContract {
  static get global(): any {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      return window;
    }

    if (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    ) {
      return global;
    }

    if (
      typeof self === 'object' &&
      self.constructor &&
      self.constructor.name === 'DedicatedWorkerGlobalScope'
    ) {
      return self;
    }

    return {};
  }

  get global() {
    return Application.global;
  }

  config: ConfigContract;
  container!: ServiceContainer;
  env: MultiEnv;
  kernel!: Kernel;
  serviceProviders: ServiceProvider[] = [];
  hasStarted = false;
  protected initializedProviders: string[] = [];

  constructor() {
    this.env = new MultiEnv();
    this.config = new Config();
    this.bootstrap();
  }

  async initializeProvider(provider: StaticServiceProvider) {
    try {
      if (!this.container) {
        throw new Error(
          `Service container not defined. ` +
            `Try registering a container by using registerContainer before registering your kernel.`,
        );
      }

      if (!this.initializedProviders.includes(provider.name)) {
        const serviceProviderInstance = new provider(this.container as ServiceContainer);
        this.serviceProviders.push(serviceProviderInstance);
        this.initializedProviders.push(provider.name);

        if (serviceProviderInstance.register) {
          await serviceProviderInstance.register();
        }

        if (serviceProviderInstance.boot) {
          await serviceProviderInstance.boot();
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to initialize service provider "${provider.name}"`);
      throw e;
    }
  }


  registerContainer(container: StaticServiceContainer) {
    this.container = new container();
    this.container.value('app', this);
    this.container.value('env', this.env);
    this.container.value('config', this.config);
    this.container.value('container', this.container);

    Application.global.use = this.container.use.bind(this.container);

    return this;
  }

  async registerEnv(...envs: StaticEnvironment[]) {
    this.env.addSources(...envs);

    await this.env.init();

    return this;
  }

  registerKernel(kernel: StaticKernel) {
    if (!this.container) {
      throw new Error(
        `Service container not defined. ` +
          `Try registering a container by using registerContainer before registering your kernel.`,
      );
    }
    this.kernel = new kernel(this.container);

    return this;
  }

  registerProviders(...providers: StaticServiceProvider[]) {
    if (!this.container) {
      throw new Error(
        `Service container not defined. ` +
          `Try registering a container by using registerContainer before registering your providers.`,
      );
    }
    providers.forEach((provider) => {
      if (!this.initializedProviders.includes(provider.name)) {
        this.serviceProviders.push(new provider(this.container as ServiceContainer));
        this.initializedProviders.push(provider.name);
      }
    });

    return this;
  }

  bootstrap() {
    // Initialize config
    Application.global.config = (key: string, fallback?: any) => {
      return this.config.get(key) ?? fallback;
    };
    // Initialize env
    Application.global.env = (key: string, fallback?: any) => {
      return this.env.get(key) ?? fallback;
    };
  }

  async start() {
    if (this.hasStarted) return;
    this.hasStarted = true;

    if (this.config.has('app')) {
      const appConfig = this.config.get('app');

      if (appConfig.container) {
        this.registerContainer(appConfig.container);
      }

      if (appConfig.kernel) {
        this.registerKernel(appConfig.kernel);
      }

      if (appConfig.services && Array.isArray(appConfig.services)) {
        this.registerProviders(...appConfig.services);
      }
    }

    if (!this.container) {
      throw new Error(
        `Service container not defined. ` +
          `Try registering a container by using registerContainer before starting the application.`,
      );
    }

    if (!this.kernel) {
      throw new Error(
        `Kernel not defined. ` +
          `Try registering a kernel by using registerKernel before starting the application.`,
      );
    }

    for (let i = 0; i < this.serviceProviders.length; i += 1) {
      const provider = this.serviceProviders[i];
      if (provider.register) {
        await provider.register();
      }
    }

    for (let i = 0; i < this.serviceProviders.length; i += 1) {
      const provider = this.serviceProviders[i];
      if (provider.boot) {
        await provider.boot();
      }
    }

    await this.kernel?.boot();
  }

  async run() {
    await this.start();
    return await this.kernel?.run();
  }
}
