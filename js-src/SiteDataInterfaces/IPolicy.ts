export default interface IPolicy {
    name: string,
    definition: string,
    virtualservers: string[],
    loadbalancer: string,
}
