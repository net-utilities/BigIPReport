interface IDeviceProperties {
  hardwareType?: string,
  icon: string,
  softwareVersions: string[],
}

export default interface IKnownDevices {
    [key: string]: IDeviceProperties
}
