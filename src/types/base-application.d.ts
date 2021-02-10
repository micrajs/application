declare namespace Application {
  interface Services {
    config: import('@micra/config').Config;
    container: import('@micra/core').ServiceContainer;
    env: import('@micra/core').Environment;
  }

  interface EnvironmentVariables {
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

/**
 * Global:
 * Extension of the global Global object.
 * This will be available in the
 * server.
 */
declare namespace NodeJS {
  interface ProcessEnv extends Application.EnvironmentVariables {}
}
