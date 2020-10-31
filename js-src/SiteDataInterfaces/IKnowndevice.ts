interface IDeviceProperties {
  hardwareType: string,
  icon: string,
  softwareVersions: string[],
}

export default interface IKnownDevice {
    [key: string]: IDeviceProperties
}
