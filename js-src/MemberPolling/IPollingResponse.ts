interface IMemberStatus {
  [key: string]: string
}

export default interface IPollingResponse {
  success: boolean
  poolname: string,
  memberstatuses: {
    member: string
  }[]
}
