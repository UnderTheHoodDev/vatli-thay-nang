export interface IListUsersParams {
  email?: string;
  fullName?: string;
  gender?: string;
  provinceId?: number;
  schoolName?: string;
  parentPhonenumber?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface IListUsersResult {
  data: any[];
  meta: any;
}

export interface IActionState {
  errors: string[];
}
