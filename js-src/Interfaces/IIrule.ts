export default interface IIrule{
  datagroups: string[],
  loadbalancer: string,
  name: string,
  virtualservers: string[],
  pools: string[],
  definition: string,
}
