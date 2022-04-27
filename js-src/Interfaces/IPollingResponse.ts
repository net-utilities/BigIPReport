export default interface IPollingResponse {
  success: boolean
  poolname: string,
  memberstatuses: {
    member: string
  }[]
}
