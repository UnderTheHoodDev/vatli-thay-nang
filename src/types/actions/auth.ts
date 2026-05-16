export interface IAuthActionResult {
  success: boolean;
  errors: string[];
  redirectTo?: string;
}

export interface ILogoutActionResult {
  success: boolean;
  errors: string[];
  redirectTo?: string;
}

export interface IConfirmActivationResult {
  success: boolean;
  errors: string[];
  redirectTo?: string;
}

export interface IChangePasswordResult {
  success: boolean;
  errors: string[];
  redirectTo?: string;
}
