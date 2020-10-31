export interface IStatusVIP {
  url: string,
  working?: boolean,
  state?: string
  reason: string
}

export default interface ILoadbalancer {
  model: string,
  serial: string,
  name: string,
  modules: {
    [key: string]: string,
  },
  active: boolean,
  color: string,
  ip: string,
  success: boolean,
  build: string,
  version: string,
  statusvip: IStatusVIP,
  category: string,
  isonlydevice: boolean,
  baseBuild: string,

}
