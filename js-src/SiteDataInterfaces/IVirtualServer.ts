export default interface IVirtualServer {
    compressionprofile: string;
    loadbalancer: string;
    currentconnections: string;
    defaultpool: string;
    ip: string;
    sslprofileclient: string[];
    sourcexlatetype: string;
    maximumconnections: string;
    cpuavg1min: string;
    pools: string[];
    availability: string;
    vlans?: string[];
    sourcexlatepool: string;
    persistence: string[];
    asmPolicies?: string[];
    cpuavg5min: string;
    enabled: string;
    sslprofileserver: string[];
    cpuavg5sec: string;
    port: string;
    name: string;
    httpprofile: string;
    description: string;
    trafficgroup: string;
    profiletype: string;
    vlanstate: string;
    irules: string[];

}
