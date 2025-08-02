export interface POSProductCategory {
  id: number;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
  cashRegisterTypeId: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePOSCategoryData extends Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdatePOSCategoryData extends Partial<CreatePOSCategoryData> {} 