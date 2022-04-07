import IPool from '../Interfaces/IPool';
import IMonitor from '../Interfaces/IMonitor';
import IVirtualServer from '../Interfaces/IVirtualServer';
import IIrule from '../Interfaces/IIrule';
import IDataGroup from '../Interfaces/IDataGroup';
import ILoadbalancer from '../Interfaces/ILoadbalancer';
import IPreferences from '../Interfaces/IPreferences';
import IKnownDevice from '../Interfaces/IKnowndevice';
import ICertificate from '../Interfaces/ICertificate';
import IDeviceGroup from '../Interfaces/IDeviceGroup';
import IASMPolicy from '../Interfaces/IASMPolicy';
import INAT from '../Interfaces/INAT';
import {IState} from '../Interfaces/IState';
import IPolicy from '../Interfaces/IPolicy';
import ILoggedError from '../Interfaces/ILoggedErrors';
import JSONFiles from '../Constants/JSONFiles';
import ISiteData from '../Interfaces/ISiteData';

export default async () => {

  let jsonResponses: any[];

  try {
    jsonResponses = await Promise.all(
      JSONFiles.map(async (url) => {
          const resp = await fetch(url, {cache: 'no-cache'});
          if (resp.status !== 200) {
            throw new Error(`Failed to load ${resp.url}, got a status code of ${resp.status} (${resp.statusText})`);
          }
          return resp.json();
        }
      ));
  } catch(e) {
    $('#jsonloadingerrordetails').append(`${(e as Error).message}`);
    $('div.beforedocumentready').hide();
    $('#firstlayerdiv').fadeIn();
    return;
  }

  const [
    pools,
    monitors,
    virtualservers,
    irules,
    datagroups,
    loadbalancers,
    preferences,
    knowndevices,
    certificates,
    devicegroups,
    asmpolicies,
    nat,
    state,
    policies,
    loggederrors,
  ] = jsonResponses;

  console.log(jsonResponses);
  const siteData: ISiteData = {
    NATdict: nat as INAT[],
    asmPolicies: asmpolicies as IASMPolicy[],
    certificates: certificates as ICertificate[],
    countDown: 0,
    datagroupdetailsTableData: [],
    datagroups: datagroups as IDataGroup[],
    deviceGroups: devicegroups as IDeviceGroup[],
    irules: irules as IIrule[],
    loadbalancers: loadbalancers as ILoadbalancer[],
    loggedErrors: (loggederrors as ILoggedError[]),
    monitors: monitors as IMonitor[],
    pools: pools as IPool[],
    state: state as IState,
    virtualservers: virtualservers as IVirtualServer[],
    policies: policies as IPolicy[],
    knownDevices: knowndevices as IKnownDevice[],
    preferences: preferences as IPreferences,
    poolsMap: new Map<string, IPool>(),
  };

  let poolNum = 0;
  siteData.pools.forEach((pool) => {
    pool.poolNum = poolNum;
    siteData.poolsMap.set(`${pool.loadbalancer}:${pool.name}`, pool);
    poolNum++;
  });

  return siteData;
}