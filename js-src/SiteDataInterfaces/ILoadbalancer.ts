export interface IStatusVIP {
  url: string,
  working?: boolean,
  state?: string
  reason: string
}

type hasSupport = 'unknown' | 'true' | 'false' | 'ignored';

export default interface ILoadbalancer {
  supportErrorMessage: string;
  hasSupport: hasSupport;
  model: string,
  serial: string,
  name: string,
  modules: {
    [key: string]: string,
  },
  active: boolean,
  color: string,
  sync: string,
  ip: string,
  success: boolean,
  build: string,
  version: string,
  statusvip: IStatusVIP,
  category: string,
  isonlydevice: boolean,
  baseBuild: string,
}
