/* eslint-disable @typescript-eslint/no-explicit-any */
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
  private _scope: Micra.ApplicationScopeOptions;
  private _configuration: Partial<Micra.ApplicationConfiguration> = {};
  private _providers: Record<string, Micra.ServiceProvider>;
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
  private parent?: Application;

  get serviceProviders(): Micra.ServiceProvider[] {
    return Object.values(this._providers);
  }

  constructor(
    configuration?: Partial<Micra.ApplicationConfiguration<any>>,
    scope?: Partial<Micra.ApplicationScopeOptions>,
    parent?: Application,
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

    this.initializeContainer(this._configuration.container ?? ServiceContainer);
    this._providers = this.parent?._providers ?? {};
    this.configuration =
      this.parent?.configuration.createScope() ?? new Configuration();
    this.environment =
      this.parent?.environment.createScope() ?? new Environment();

    this._scope = {
      name: scope?.name ?? 'global',
      global: scope?.global ?? ['registerGlobal', 'bootGlobal'],
      environment: scope?.environment ?? [
        'registerEnvironment',
        'bootEnvironment',
      ],
      configuration: scope?.configuration ?? [
        'registerConfiguration',
        'bootConfiguration',
      ],
      provider: scope?.provider ?? ['register', 'boot'],
      terminate: scope?.provider ?? ['terminate'],
    };

    if (this._configuration.autoRun === true) {
      this.run();
    }
  }

  private async runHook(
    hook: keyof Micra.ServiceProvider,
    providers: Micra.ServiceProvider[],
  ): Promise<void> {
    for (const provider of providers) {
      await provider[hook]?.(this);
    }
  }

  private async initializeGlobals(
    globals: Micra.ApplicationConfiguration['globals'],
  ): Promise<void> {
    this.globals = {...this.globals, ...globals};

    for (const hook of this._scope.global) {
      await this.runHook(hook, this.serviceProviders);
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
    container: Micra.ApplicationConfiguration['container'],
  ): void {
    this.container = this.parent?.container?.clone() ?? new container();
  }

  private async initializeEnvironment(
    environments: Micra.ApplicationConfiguration['environments'],
  ): Promise<void> {
    for (const environment of Object.values(environments)) {
      this.environment.addSources(getInstanceOf(environment));
    }

    await this.environment.init();

    for (const hook of this._scope.environment) {
      await this.runHook(hook, this.serviceProviders);
    }
  }

  private async initializeConfigurations(
    configurations: Micra.ApplicationConfiguration['configurations'],
  ): Promise<void> {
    Object.entries(configurations).forEach(([key, value]) => {
      this.configuration.set(
        key as keyof Application.Configurations,
        getInstanceOf(
          value,
        ) as Application.Configurations[keyof Application.Configurations],
      );
    });

    for (const hook of this._scope.configuration) {
      await this.runHook(hook, this.serviceProviders);
    }
  }

  private instantiateProviders(
    serviceProviders:
      | Record<string, Micra.ServiceProvider | Static<Micra.ServiceProvider>>
      | Array<Micra.ServiceProvider | Static<Micra.ServiceProvider>>,
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

  async initializeProviders(
    serviceProviders:
      | Record<string, Micra.ServiceProvider | Static<Micra.ServiceProvider>>
      | Array<Micra.ServiceProvider | Static<Micra.ServiceProvider>>,
  ): Promise<void> {
    const providers = this.instantiateProviders(serviceProviders);

    for (const hook of this._scope.provider) {
      await this.runHook(hook, providers);
    }
  }

  private async initializeKernel(
    kernel: Micra.ApplicationConfiguration['kernel'],
  ): Promise<void> {
    this.kernel = getInstanceOf(kernel);

    await this.kernel.boot?.(this);
  }

  async run<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration<Return>>,
  ): Promise<Return> {
    try {
      await this.start<Return>(configuration);

      this.emit('willRun');
      return (await this.kernel.run?.(this)) as unknown as Return;
    } catch (thrown) {
      const error = normalizeError(thrown);
      this.emitSync('error', error);
      throw error;
    }
  }

  async start<Return = void>(
    configuration?: Partial<Micra.ApplicationConfiguration<Return>>,
  ): Promise<void> {
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
    this.initializeContainer(this._configuration.container ?? ServiceContainer);
    this.emit('containerReady', this.container);
    this.emit('willInitializeEnvironments');
    await this.initializeEnvironment(this._configuration.environments ?? {});
    this.emit('environmentsReady', this.environment);
    this.emit('willInitializeConfigurations');
    this.initializeConfigurations(
      this._configuration.configurations ?? ({} as Application.Configurations),
    );
    this.emit('configurationsReady', this.configuration);
    this.emit('willInitializeProviders');
    for (const hook of this._scope.provider) {
      await this.runHook(hook, this.serviceProviders);
    }
    this.emit('providersReady', this.serviceProviders);
    this.emit('willInitializeKernel');
    await this.initializeKernel(this._configuration.kernel ?? {});
    this.emit('kernelReady', this.kernel);
    this.emit('applicationReady');
  }

  async terminate(): Promise<void> {
    this.emit('willTerminate');
    this.kernel.terminate?.(this);
    for (const hook of this._scope.terminate) {
      await this.runHook(hook, this.serviceProviders);
    }
    this.emit('terminated');
  }

  createScope(
    name: string,
    options?: Partial<Omit<Micra.ApplicationScopeOptions, 'name'>>,
  ): Micra.Application {
    const configurations = this._configuration.scopes?.[name] ?? {};
    const app = new Application(configurations, {name, ...options}, this);

    if (configurations.autoRun === true) {
      app.run();
    }

    return app;
  }
}
