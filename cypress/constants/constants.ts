export const REPORT_ROOT = 'https://localhost:8443';

// Testing showing pool details
export const VIP_WITH_IRULE = '/Common/select-pool-by-irule';
export const LOADBALANCING_SE_POOL = '/Common/loadbalancing-se';

// Testing the direct links generated when browsing the report

// Direct link to VIP details
export const DIRECT_LINK_VIP_DETAILS_NAME = '/Common/select-pool-by-irule';
export const DIRECT_LINK_VIP_DETAILS_URL =
  `${REPORT_ROOT}/#m=v&virtualserver=${DIRECT_LINK_VIP_DETAILS_NAME}@bigip.xip.se`;

// Direct link pool details
export const DIRECT_LINK_POOL_DETAILS_NAME = '/Common/loadbalancing-se';
export const DIRECT_LINK_POOL_DETAILS_URL =
  `${REPORT_ROOT}#m=v&pool=${DIRECT_LINK_POOL_DETAILS_NAME}@bigip.xip.se`;

// Direct link to a global search
export const DIRECT_LINK_GLOBAL_SEARCH = 'select-pool';
export const DIRECT_LINK_GLOBAL_SEARCH_URL =
  `${REPORT_ROOT}/#m=v&v,q=${DIRECT_LINK_GLOBAL_SEARCH}`;

// Direct link to a search by the column name
export const DIRECT_LINK_SEARCH_BY_VIP_NAME = 'select-pool';
export const DIRECT_LINK_SEARCH_BY_VIP_NAME_URL =
  `${REPORT_ROOT}/#m=v&v,1=${DIRECT_LINK_SEARCH_BY_VIP_NAME}`;

export const DIRECT_LINK_SEARCH_BY_IP_PORT = '10.10.10.2:443';
export const DIRECT_LINK_SEARCH_BY_IP_PORT_URL =
  `${REPORT_ROOT}/#m=v&v,3=${DIRECT_LINK_SEARCH_BY_IP_PORT}`;
