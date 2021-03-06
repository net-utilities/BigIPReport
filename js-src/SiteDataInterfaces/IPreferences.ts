export default interface IPreferences {
  supportCheckEnabled: boolean;
  HideLoadBalancerFQDN: boolean,
  NavLinks: { [key: string]: string },
  PollingMaxPools: number,
  PollingMaxQueue: number,
  PollingRefreshRate: number,
  ShowDataGroupLinks: boolean,
  ShowiRuleLinks: boolean,
  ShowiRules: string,
  autoExpandPools: boolean,
  executionTime: number,
  regexSearch: boolean,
  scriptServer: string,
  scriptVersion: string,
  showAdcLinks: boolean,
  startTime: string,
  currentReportDate: number,
}
