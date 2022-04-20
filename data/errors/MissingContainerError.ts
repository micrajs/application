import {MicraError} from '@micra/error';

export class MissingContainerError extends MicraError {
  statusCode = 500;

  constructor() {
    super(
      `Service container not defined. ` +
        `Try registering a container by using registerContainer before registering your kernel.`,
    );
    Object.setPrototypeOf(this, MissingContainerError.prototype);
  }

  serialize(): Micra.ErrorMessage[] {
    return [
      {
        status: this.statusCode,
        title: 'Missing service container',
        detail: this.message,
      },
    ];
  }
}
