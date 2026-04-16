export interface IDataGroupData {
  [key: string]: string
}

export default interface IDataGroup {
  name: string,
  type: string,
  loadbalancer: string,
  pools: string[],
  data: IDataGroupData
}
