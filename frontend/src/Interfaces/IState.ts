type HasSupport = 'unknown' | 'true' | 'false' | 'ignored';

interface ICertificateAlert {
    fileName: string,
    loadbalancer: string,
    expiresInDays: number,
    commonName: string,
    key: string,
    lastAlerted: number,
}

export interface ISupportState {
    supportErrorMessage: string
    lastChecked: string
    hasSupport: HasSupport
    serial?: string

}

export interface IState {
    scriptVersion: string
    certificateAlerts?: { [key: string]: ICertificateAlert }
    supportStates?: { [key: string]: ISupportState }
}
