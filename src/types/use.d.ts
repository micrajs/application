/**
 * Use:
 * This is the global helper that gives access to
 * the service container. It's an easy way to
 * resolve registered services.
 */
declare const use: Use;
type Use = <K extends keyof Application.Services>(
  namespace: K,
) => Application.Services[K];

/**
 * Window:
 * Extension of the global Window object.
 * This will be available in the
 * browser.
 */
interface Window {
  use: Use;
}

/**
 * Global:
 * Extension of the global Global object.
 * This will be available in the
 * server.
 */
declare namespace NodeJS {
  interface Global {
    use: Use;
  }
}
