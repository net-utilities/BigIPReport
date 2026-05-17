export default interface IMonitor {
  timeout: string,
  type: string,
  name: string,
  sendstring: string,
  loadbalancer: string,
  receivestring: string,
  interval: string,
  disablestring: string,
}
