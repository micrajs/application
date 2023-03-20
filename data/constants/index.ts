export const GLOBAL_SCOPE: Micra.ApplicationScopeOptions = {
  name: 'global',
  global: ['registerGlobal', 'bootGlobal'],
  environment: ['registerEnvironment', 'bootEnvironment'],
  configuration: ['registerConfiguration', 'bootConfiguration'],
  provider: ['register', 'boot'],
  terminate: ['terminate'],
};

export const DEFAULT_SCOPE: Micra.ApplicationScopeOptions = {
  name: 'default',
  global: [],
  environment: [],
  configuration: [],
  provider: [],
  terminate: [],
};
