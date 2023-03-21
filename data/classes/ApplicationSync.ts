/* eslint-disable @typescript-eslint/no-explicit-any */
import {Configuration} from '@micra/configuration';
import type {MaybeInstanceOf} from '@micra/core/utilities/MaybeInstanceOf';
import {Environment} from '@micra/environment';
import {normalizeError} from '@micra/error';
import {EventEmitter} from '@micra/event-emitter';
import {ServiceContainer} from '@micra/service-container';
import {DEFAULT_SCOPE, GLOBAL_SCOPE} from '../constants';
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
  private _scope: Micra.ApplicationScopeOptions;
  private _configuration: Partial<Micra.ApplicationConfiguration> = {};
  private _providers: Record<string, Micra.ServiceProvider> = {};
  private _hasStarted = false;
  globals: Micra.Globals = {
    app: false,
    config: true,
    env: true,
    use: true,
  };

  configuration: Configuration;
  container!: Micra.ServiceContainer;
  environment: Environment;
  kernel!: Micra.Kernel;
  private parent?: ApplicationSync;

  get serviceProviders(): Micra.ServiceProvider[] {
    return (this.parent?.serviceProviders ?? []).concat(
      Object.values(this._providers),
    );
  }

  constructor(
    configuration?: Partial<Micra.ApplicationConfiguration<any>>,
    scope?: Partial<Micra.ApplicationScopeOptions>,
    parent?: ApplicationSync,
  ) {
    super();

    if (configuration) {
      this._configuration = configuration;
    }
    if (parent) {
      Object.defineProperty(this, 'parent', {
        value: parent,
        enumerable: false,
      });
    }

    this.initializeContainer(
      this._configuration.container ??
        this.parent?.container?.clone() ??
        ServiceContainer,
    );
    this.configuration =
      this.parent?.configuration.createScope() ?? new Configuration();
    this.environment =
      this.parent?.environment.createScope() ?? new Environment();

    this._scope =
      parent == null
        ? GLOBAL_SCOPE
        : {
            name: scope?.name ?? DEFAULT_SCOPE.name,
            global: scope?.global ?? DEFAULT_SCOPE.global,
            environment: scope?.environment ?? DEFAULT_SCOPE.environment,
            configuration: scope?.configuration ?? DEFAULT_SCOPE.configuration,
            provider: scope?.provider ?? DEFAULT_SCOPE.provider,
            terminate: scope?.terminate ?? DEFAULT_SCOPE.terminate,
          };

    if (this._configuration.autoRun === true) {
      this.run();
    }
  }

  private runHook(
    hook: keyof Micra.ServiceProvider,
    providers: Micra.ServiceProvider[],
  ): void {
    for (const provider of providers) {
      provider[hook]?.(this);
    }
  }

  private initializeGlobals(
    globals: Micra.ApplicationConfiguration['globals'],
  ): void {
    this.globals = {...this.globals, ...globals};

    for (const hook of this._scope.global) {
      this.runHook(hook, this.serviceProviders);
    }

    if (this.globals.use === true && !this._global.use) {
      this._global.use = createUseHelper(this);
    }

    if (this.globals.env === true && !this._global.env) {
      this._global.env = createEnvHelper(this);
    }

    if (this.globals.config === true && !this._global.config) {
      this._global.config = createConfigHelper(this);
    }

    if (this.globals.app === true && !this._global.app) {
      this._global.app = this;
    }

    for (const [key, value] of Object.entries(this.globals)) {
      if (typeof value === 'function') {
        (this._global as any)[key] = value(this);
      }
    }
  }

  private initializeContainer(
    container: MaybeInstanceOf<Micra.ServiceContainer>,
  ): void {
    this.container = getInstanceOf(container);
  }

  private initializeEnvironment(
    environments: Micra.ApplicationConfiguration['environments'],
  ): void {
    for (const environment of Object.values(environments)) {
      this.environment.addSources(getInstanceOf(environment));
    }

    this.environment.initSync();

    for (const hook of this._scope.environment) {
      this.runHook(hook, this.serviceProviders);
    }
  }

  private initializeConfigurations(
    configurations: Micra.ApplicationConfiguration['configurations'],
  ): void {
    Object.entries(configurations).forEach(([key, value]) => {
      this.configuration.set(
        key as keyof Application.Configurations,
        getInstanceOf(
          value,
        ) as Application.Configurations[keyof Application.Configurations],
      );
    });

    for (const hook of this._scope.configuration) {
      this.runHook(hook, this.serviceProviders);
    }
  }

  private instantiateProviders(
    serviceProviders:
      | Record<string, MaybeInstanceOf<Micra.ServiceProvider>>
      | Array<MaybeInstanceOf<Micra.ServiceProvider>>,
  ): Micra.ServiceProvider[] {
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
    this._providers = {...this._providers, ...serviceProvidersInstances};
    return providers;
  }

  initializeProviders = ((
    serviceProviders:
      | Record<string, MaybeInstanceOf<Micra.ServiceProvider>>
      | Array<MaybeInstanceOf<Micra.ServiceProvider>>,
  ): void => {
    const providers = this.instantiateProviders(serviceProviders);

    for (const hook of this._scope.provider) {
      this.runHook(hook, providers);
    }
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
      this.emitSync('error', error);
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

    this.instantiateProviders(this._configuration.providers ?? {});
    this.initializeGlobals(this._configuration.globals ?? {});

    this.emit('willInitializeContainer');
    if (this._configuration.container) {
      this.initializeContainer(this._configuration.container);
    }
    this.emit('containerReady', this.container);
    this.emit('willInitializeEnvironments');
    this.initializeEnvironment(this._configuration.environments ?? {});
    this.emit('environmentsReady', this.environment);
    this.emit('willInitializeConfigurations');
    this.initializeConfigurations(
      this._configuration.configurations ?? ({} as Application.Configurations),
    );
    this.emit('configurationsReady', this.configuration);
    this.emit('willInitializeProviders');
    for (const hook of this._scope.provider) {
      this.runHook(hook, this.serviceProviders);
    }
    this.emit('providersReady', this.serviceProviders);
    this.emit('willInitializeKernel');
    this.initializeKernel(this._configuration.kernel ?? {});
    this.emit('kernelReady', this.kernel);
    this.emit('applicationReady');
  }) as Micra.Application['start'];

  terminate = ((): void => {
    this.emit('willTerminate');
    this.kernel.terminate?.(this);
    for (const hook of this._scope.terminate) {
      this.runHook(hook, this.serviceProviders);
    }
    this.emit('terminated');
  }) as Micra.Application['terminate'];

  createScope(
    name: string,
    options?: Partial<Omit<Micra.ApplicationScopeOptions, 'name'>>,
  ): Micra.Application {
    const configurations = this._configuration.scopes?.[name] ?? {};
    const app = new ApplicationSync(configurations, {name, ...options}, this);

    if (configurations.autoRun === true) {
      app.run();
    }

    return app;
  }
}
