/**
 * Which JSON Files to load when the script starts
 * Remember to also change Init/getJSONFiles.ts if changing this
 * to get the correct order when deconstructing the Promise.All
 * array.
 */

export default [
  'json/pools.json',
  'json/monitors.json',
  'json/virtualservers.json',
  'json/irules.json',
  'json/datagroups.json',
  'json/loadbalancers.json',
  'json/preferences.json',
  'json/knowndevices.json',
  'json/certificates.json',
  'json/devicegroups.json',
  'json/asmpolicies.json',
  'json/nat.json',
  'json/state.json',
  'json/policies.json',
  'json/loggederrors.json'
];