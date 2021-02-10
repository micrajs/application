import {
  StaticKernel,
  StaticServiceContainer,
  StaticServiceProvider,
} from '@micra/core';

export interface GlobalHelpers {
  config: boolean;
  env: boolean;
  use: boolean;
}

export interface AppConfig {
  container?: StaticServiceContainer;
  kernel?: StaticKernel;
  services?: StaticServiceProvider[];
}
