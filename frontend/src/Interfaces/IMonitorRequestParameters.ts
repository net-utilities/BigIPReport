export interface IMonitorHeader {
  key: string,
  value: string,
}

export interface IMonitorRequestParameters {
  verb?: string,
  uri?: string,
  version?: string,
  headers?: IMonitorHeader[],
}
