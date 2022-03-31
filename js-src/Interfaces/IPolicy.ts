export default interface IPolicy {
    definition: string,
    loadbalancer: string,
    name: string,
    virtualservers: string[],
}
