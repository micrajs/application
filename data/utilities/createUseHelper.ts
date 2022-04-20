import {MissingContainerError} from '../errors/MissingContainerError';

export function createUseHelper(application: Micra.Application): Micra.Use {
  return function Use<Namespace extends keyof Application.Services>(
    namespace: Namespace,
  ): Application.Services[Namespace] {
    if (!application.container) {
      throw new MissingContainerError();
    }

    return application.container.use(namespace);
  };
}
