export default interface IPollingResponse {
  success: boolean
  poolname: string,
  memberstatuses: {[key: string]: string}
}
