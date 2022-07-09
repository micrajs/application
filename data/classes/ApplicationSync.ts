import {Configuration} from '@micra/configuration';
import {Static} from '@micra/core/utilities/Static';
import {Environment} from '@micra/environment';
import {EventEmitter} from '@micra/event-emitter';
import {normalizeError} from '@micra/error';
import {ServiceContainer} from '@micra/service-container';
import {createConfigHelper} from '../utilities/createConfigHelper';
import {createEnvHelper} from '../utilities/createEnvHelper';
import {createUseHelper} from '../utilities/createUseHelper';
import {getGlobal} from '../utilities/getGlobal';
import {getInstanceOf} from '../utilities/getInstanceOf';

export class ApplicationSync
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

  private initializeEnvironment(
    environments: Micra.ApplicationConfiguration['environments'],
  ): void {
    if (this._globals.env && !this._global.env) {
      this._global.env = createEnvHelper(this);
    }

    for (const environment of Object.values(environments)) {
      this.environment.addSources(getInstanceOf(environment));
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
        getInstanceOf(
          value,
        ) as Application.Configurations[keyof Application.Configurations],
      );
    });
  }

  initializeProviders = ((
    serviceProviders: Record<
      string,
      Micra.ServiceProvider | Static<Micra.ServiceProvider>
    >,
  ): void => {
    const providers: Micra.ServiceProvider[] = [];
    const serviceProvidersInstances = Object.entries(serviceProviders).reduce(
      (instances, [key, provider]) => {
        const instance = getInstanceOf(provider);
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
  }) as Micra.Application['initializeProviders'];

  private initializeKernel(
    kernel: Micra.ApplicationConfiguration['kernel'],
  ): void {
    this.kernel = getInstanceOf(kernel);

    this.kernel.boot?.(this);
  }

  run<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration>,
  ): Return {
    try {
      this.start(configuration);

      this.emit('willRun');
      return this.kernel.run?.(this) as unknown as Return;
    } catch (thrown) {
      const error = normalizeError(thrown);

      this.emitSync('onError', normalizeError(thrown));

      throw error;
    }
  }

  start = (<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration<Return>>,
  ): void => {
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
    this.initializeEnvironment(this._configuration.environments ?? {});
    this.emit('didInitializeEnvironments', this.environment);
    this.emit('willInitializeConfigurations');
    this.initializeConfigurations(
      this._configuration.configurations ?? ({} as Application.Configurations),
    );
    this.emit('didInitializeConfigurations', this.configuration);
    this.emit('willInitializeProviders');
    this.initializeProviders(this._configuration.providers ?? {});
    this.emit('didInitializeProviders', this.serviceProviders);
    this.emit('willInitializeKernel');
    this.initializeKernel(this._configuration.kernel ?? {});
    this.emit('didInitializeKernel', this.kernel);
    this.emit('didStart');
  }) as Micra.Application['start'];
}
