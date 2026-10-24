export interface LocationDTO {
  departmentId: number;
  provinceId: number;
  districtId: number;
}

export interface EmploymentContractDetailsDTO {
  institutionId: number;
  schoolYearId: number;
  jobPositionId: number;
  areaId?: number | null;
  startDate: string;
  endDate?: string | null;
  salary?: number | null;
}

export interface CreateStaffMemberDTO {
  names: string;
  paternalLastname: string;
  maternalLastname: string;
  genderId: number;
  birthDate: string;
  documentTypeId: number;
  idDocumentNumber: string;
  civilStateId?: number | null;
  address?: string | null;
  addressLocation?: LocationDTO | null;
  email?: string | null;
  landlinePhone?: string | null;
  cellPhone?: string | null;
  levelOfEducationId?: number | null;
  professionalTitle?: string | null;
  employeeCode?: string | null;
  previousInstitution?: string | null;
  spouseName?: string | null;
  spouseDocumentNumber?: string | null;
  spouseOccupation?: string | null;
  numberOfChildren?: number | null;
  comment?: string | null;
  contract: EmploymentContractDetailsDTO;
}

export interface StaffMemberListDTO {
  id: number;
  fullName: string;
  documentNumber: string;
  employeeCode: string | null;
  professionalTitle: string | null;
}
