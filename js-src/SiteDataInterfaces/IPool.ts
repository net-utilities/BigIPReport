export interface Member {
  ip: string;
  currentconnections: string;
  availability: string;
  enabled: string;
  status: string;
  priority: number;
  maximumconnections: string;
  name: string;
  port: string;
  realtimestatus: string;
}

export default interface Pool {
  description: string;
  enabled: string;
  loadbalancingmethod: string;
  status: string;
  name: string;
  allowsnat: string;
  monitors: string[];
  allownat: string;
  actiononservicedown: string;
  orphaned: boolean;
  members: Member[];
  loadbalancer: string;
  availability: string;
  poolNum?: number;
}
