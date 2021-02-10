/**
 * Config:
 * This is the global helper that gives access to the app's
 * configurations. It's an easy way to resolve the
 * registered config for the services.
 */
declare const config: Config;
type Config = <
  K extends keyof Application.Config,
  R extends Application.Config[K]
>(
  namespace: K,
  fallback?: R,
) => R;

/**
 * Window:
 * Extension of the global Window object.
 * This will be available in the
 * browser.
 */
interface Window {
  config: Config;
}

/**
 * Global:
 * Extension of the global Global object.
 * This will be available in the
 * server.
 */
declare namespace NodeJS {
  interface Global {
    config: Config;
  }
}
