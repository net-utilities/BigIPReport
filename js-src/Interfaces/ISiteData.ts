import IASMPolicy from './IASMPolicy';
import ICertificate from './ICertificate';
import IDataGroup from './IDataGroup';
import IDeviceGroup from './IDeviceGroup';
import IIrule from './IIrule';
import IKnownDevice from './IKnowndevice';
import ILoadbalancer from './ILoadbalancer';
import ILoggedError from './ILoggedErrors';
import IMonitor from './IMonitor';
import INAT from './INAT';
import IPool from './IPool';
import IPreferences from './IPreferences';
import IVirtualServer from './IVirtualServer';
import IMemberState from './IMemberStates';
import { IState } from './IState';
import 'datatables.net';
import 'datatables.net-buttons';
import IPolicy from './IPolicy';

export interface PatchedSettings extends DataTables.Settings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buttons: any;
}

export default interface ISiteData {
  NATdict: INAT,
  asmPolicies: IASMPolicy[],
  bigipTable?: DataTables.Api,
  certificateTable?: DataTables.Api,
  certificates: ICertificate[],
  clock?: number,
  countDown: number,
  dataGroupTable?: DataTables.Api,
  datagroupdetailsTable?: DataTables.Api,
  datagroupdetailsTableData: unknown[],
  datagroups: IDataGroup[],
  deviceGroups: IDeviceGroup[],
  iRuleTable?: DataTables.Api,
  PolicyTable?: DataTables.Api,
  irules: IIrule[],
  knownDevices: IKnownDevice[],
  loadbalancers: ILoadbalancer[],
  logTable?: DataTables.Api,
  loggedErrors: ILoggedError[],
  memberStates?: IMemberState,
  monitors: IMonitor[],
  poolTable?: DataTables.Api,
  pools: IPool[],
  poolsMap: Map<string, IPool>,
  preferences?: IPreferences,
  virtualservers: IVirtualServer[],
  policies: IPolicy[],
  state?: IState,
}
