import {Configuration} from '@micra/configuration';
import {Environment} from '@micra/environment';
import {EventEmitter} from '@micra/event-emitter';
import {ServiceContainer} from '@micra/service-container';
import {getGlobal} from '../utilities/getGlobal';
import {createEnvHelper} from '../utilities/createEnvHelper';
import {createConfigHelper} from '../utilities/createConfigHelper';
import {createUseHelper} from '../utilities/createUseHelper';
import {isClass} from '../utilities/isClass';
import {Static} from '@micra/core/utilities/Static';

export class Application
  extends EventEmitter<Micra.ApplicationEvents>
  implements Micra.Application
{
  private _global: typeof globalThis & {
    use?: Micra.Use;
    env?: Micra.Env;
    config?: Micra.Config;
    app?: Micra.Application;
  } = getGlobal();
  private _configuration: Partial<Micra.ApplicationConfiguration> = {};
  private _providers: Record<string, Micra.ServiceProvider> = {};
  private _hasStarted = false;
  private _globals: Micra.Globals = {
    app: false,
    config: true,
    env: true,
    use: true,
  };

  configuration: Configuration = new Configuration();
  container!: Micra.ServiceContainer;
  environment: Environment = new Environment();
  kernel!: Micra.Kernel;

  get serviceProviders(): Micra.ServiceProvider[] {
    return Object.values(this._providers);
  }

  constructor(configuration?: Partial<Micra.ApplicationConfiguration>) {
    super();

    if (configuration) {
      this._configuration = configuration;
    }
  }

  private initializeGlobals(
    globals: Micra.ApplicationConfiguration['globals'],
  ): void {
    this._globals = {...this._globals, ...globals};
  }

  private initializeContainer(
    container: Micra.ApplicationConfiguration['container'],
  ): void {
    if (this._globals.use && !this._global.use) {
      this._global.use = createUseHelper(this);
    }

    this.container = new container();
  }

  private async initializeEnvironment(
    environments: Micra.ApplicationConfiguration['environments'],
  ): Promise<void> {
    if (this._globals.env) {
      this._global.env = createEnvHelper(this);
    }

    for (const environment of Object.values(environments)) {
      this.environment.addSources(isClass(environment));
    }

    await this.environment.init();
  }

  private initializeEnvironmentSync(
    environments: Micra.ApplicationConfiguration['environments'],
  ): void {
    if (this._globals.env && !this._global.env) {
      this._global.env = createEnvHelper(this);
    }

    for (const environment of Object.values(environments)) {
      this.environment.addSources(isClass(environment));
    }

    this.environment.initSync();
  }

  private initializeConfigurations(
    configurations: Micra.ApplicationConfiguration['configurations'],
  ): void {
    if (this._globals.config && !this._global.config) {
      this._global.config = createConfigHelper(this);
    }

    Object.entries(configurations).forEach(([key, value]) => {
      this.configuration.set(
        key as keyof Application.Configurations,
        isClass(
          value,
        ) as Application.Configurations[keyof Application.Configurations],
      );
    });
  }

  async initializeProviders(
    serviceProviders: Record<
      string,
      Micra.ServiceProvider | Static<Micra.ServiceProvider>
    >,
  ): Promise<void> {
    const providers: Micra.ServiceProvider[] = [];
    const serviceProvidersInstances = Object.entries(serviceProviders).reduce(
      (instances, [key, provider]) => {
        const instance = isClass(provider);
        instances[key] = instance;
        providers.push(instance);
        return instances;
      },
      {} as Record<string, Micra.ServiceProvider>,
    );

    for (const provider of providers) {
      if (provider.register) {
        await provider.register(this);
      }
    }

    for (const provider of providers) {
      if (provider.boot) {
        await provider.boot(this);
      }
    }

    this._providers = {...this._providers, ...serviceProvidersInstances};
  }

  initializeProvidersSync(
    serviceProviders: Record<
      string,
      Micra.ServiceProvider | Static<Micra.ServiceProvider>
    >,
  ): void {
    const providers: Micra.ServiceProvider[] = [];
    const serviceProvidersInstances = Object.entries(serviceProviders).reduce(
      (instances, [key, provider]) => {
        const instance = isClass(provider);
        instances[key] = instance;
        providers.push(instance);
        return instances;
      },
      {} as Record<string, Micra.ServiceProvider>,
    );

    for (const provider of providers) {
      if (provider.register) {
        provider.register(this);
      }
    }

    for (const provider of providers) {
      if (provider.boot) {
        provider.boot(this);
      }
    }

    this._providers = {...this._providers, ...serviceProvidersInstances};
  }

  private async initializeKernel(
    kernel: Micra.ApplicationConfiguration['kernel'],
  ): Promise<void> {
    this.kernel = isClass(kernel);

    await this.kernel.boot?.(this);
  }

  private initializeKernelSync(
    kernel: Micra.ApplicationConfiguration['kernel'],
  ): void {
    this.kernel = isClass(kernel);

    this.kernel.boot?.(this);
  }

  async run<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration>,
  ): Promise<Return> {
    try {
      await this.start(configuration);

      this.emit('willRun');
      return (await this.kernel.run?.(this)) as unknown as Return;
    } catch (e) {
      this.emitSync('onError', e as Micra.Error);
      throw e;
    }
  }

  runSync<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration>,
  ): Return {
    try {
      this.startSync(configuration);

      this.emit('willRun');
      return this.kernel.run?.(this) as unknown as Return;
    } catch (e) {
      this.emitSync('onError', e as Micra.Error);
      throw e;
    }
  }

  async start(
    configuration?: Partial<Micra.ApplicationConfiguration>,
  ): Promise<void> {
    if (this._hasStarted) {
      return;
    }
    this._hasStarted = true;
    this.emit('willStart');

    if (configuration) {
      this._configuration = Object.assign(this._configuration, configuration);
    }

    this.initializeGlobals(this._configuration.globals ?? {});

    if (this._globals.app && !this._global.app) {
      this._global.app = this;
    }

    this.emit('willInitializeContainer');
    this.initializeContainer(this._configuration.container ?? ServiceContainer);
    this.emit('didInitializeContainer', this.container);
    this.emit('willInitializeEnvironments');
    await this.initializeEnvironment(this._configuration.environments ?? {});
    this.emit('didInitializeEnvironments', this.environment);
    this.emit('willInitializeConfigurations');
    this.initializeConfigurations(
      this._configuration.configurations ?? ({} as Application.Configurations),
    );
    this.emit('didInitializeConfigurations', this.configuration);
    this.emit('willInitializeProviders');
    await this.initializeProviders(this._configuration.providers ?? {});
    this.emit('didInitializeProviders', this.serviceProviders);
    this.emit('willInitializeKernel');
    await this.initializeKernel(this._configuration.kernel ?? {});
    this.emit('didInitializeKernel', this.kernel);
    this.emit('didStart');
  }

  startSync(configuration?: Partial<Micra.ApplicationConfiguration>): void {
    if (this._hasStarted) {
      return;
    }
    this._hasStarted = true;
    this.emit('willStart');

    if (configuration) {
      this._configuration = Object.assign(this._configuration, configuration);
    }

    this.initializeGlobals(this._configuration.globals ?? {});

    if (this._globals.app && !this._global.app) {
      this._global.app = this;
    }

    this.emit('willInitializeContainer');
    this.initializeContainer(this._configuration.container ?? ServiceContainer);
    this.emit('didInitializeContainer', this.container);
    this.emit('willInitializeEnvironments');
    this.initializeEnvironmentSync(this._configuration.environments ?? {});
    this.emit('didInitializeEnvironments', this.environment);
    this.emit('willInitializeConfigurations');
    this.initializeConfigurations(
      this._configuration.configurations ?? ({} as Application.Configurations),
    );
    this.emit('didInitializeConfigurations', this.configuration);
    this.emit('willInitializeProviders');
    this.initializeProvidersSync(this._configuration.providers ?? {});
    this.emit('didInitializeProviders', this.serviceProviders);
    this.emit('willInitializeKernel');
    this.initializeKernelSync(this._configuration.kernel ?? {});
    this.emit('didInitializeKernel', this.kernel);
    this.emit('didStart');
  }
}
