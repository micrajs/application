/// <reference types="@micra/core/contracts/base-application" />
/// <reference types="../types/base-application" />
/// <reference types="../types/config" />
/// <reference types="../types/env" />
/// <reference types="../types/use" />

declare namespace Application {
  interface Services {
    app: import('./SyncApplication').Application;
  }

  interface Config {
    app: import('../types').AppConfig;
  }
}
