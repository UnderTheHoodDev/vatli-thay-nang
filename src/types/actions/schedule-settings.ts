export interface IScheduleSettings {
  id: number;
  academicYearFrom: number;
  academicYearTo: number;
  imageUrl: string;
  imageStorageKey: string;
  updatedAt: string;
}

export interface IUpdateScheduleSettingsPayload {
  academicYearFrom: number;
  academicYearTo: number;
  imageUrl: string;
  imageStorageKey: string;
}
