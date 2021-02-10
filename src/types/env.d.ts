/**
 * Env:
 * This is the global helper that gives access to the app's
 * environmental variables. It's an easy way to resolve
 * the registered variables.
 */
declare const env: Env;
type Env = {
  <K extends keyof Application.EnvironmentVariables>(variable: K):
    | Application.EnvironmentVariables[K]
    | undefined;
  <K extends keyof Application.EnvironmentVariables>(
    variable: K,
    fallback: Application.EnvironmentVariables[K],
  ): Application.EnvironmentVariables[K];
};

/**
 * Window:
 * Extension of the global Window object.
 * This will be available in the
 * browser.
 */
interface Window {
  env: Env;
}

/**
 * Global:
 * Extension of the global Global object.
 * This will be available in the
 * server.
 */
declare namespace NodeJS {
  interface Global {
    env: Env;
  }
}

