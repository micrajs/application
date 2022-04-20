import type {PathsOf, PathValue} from '@micra/core/utilities/DotNotation';

export function createConfigHelper(
  application: Micra.Application,
): Micra.Config {
  return function Config<Path extends PathsOf<Application.Configurations>>(
    path: Path,
    fallback?: PathValue<Application.Configurations, Path>,
  ): PathValue<Application.Configurations, Path> | undefined {
    return application.configuration.get(path, fallback);
  };
}
