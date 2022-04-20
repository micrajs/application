export function createEnvHelper(application: Micra.Application): Micra.Env {
  return function Env<Key extends keyof Application.EnvironmentVariables>(
    key: Key,
    fallback?: Application.EnvironmentVariables[Key],
  ): Application.EnvironmentVariables[Key] | undefined {
    return application.environment.get(key, fallback);
  };
}
