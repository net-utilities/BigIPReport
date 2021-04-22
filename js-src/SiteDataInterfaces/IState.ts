
type hasSupport = 'unknown' | 'true' | 'false' | 'ignored';

interface ICertificateAlert {
    fileName: string,
    loadbalancer: string,
    expiresInDays: number,
    commonName: string,
    key: string,
    lastAlerted: number,
}

interface ISupportState {
    supportErrorMessage: string,
    lastChecked: string,
    hasSupport: hasSupport
}

export interface IState {
    certificateAlerts: { [key: string]: ICertificateAlert }
    supportStates: { [key: string]: ISupportState }
}
