export type DepartmentData = {
  id: number;
  name: string;
  code: string;
};

export type ProvinceData = {
  id: number;
  name: string;
  code: string;
  departmentId: number;
};

export type DistrictData = {
  id: number;
  name: string;
  code: string;
  provinceId: number;
};
