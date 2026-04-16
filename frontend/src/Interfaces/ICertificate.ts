interface ISubject {
  organizationName: string,
  localityName: string,
  stateName: string,
  commonName: string,
  countryName: string,
  divisionName: string,
}

export default interface ICertificate {
  issuer: string,
  loadbalancer: string,
  subjectAlternativeName: string ,
  fileName: string,
  subject: ISubject,
  expirationDate: number,
}
