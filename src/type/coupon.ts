export enum CouponType {
  Percentage = 'Percentage',
  FixedAmount = 'FixedAmount',
  FreeShipping = 'FreeShipping'
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discountType: CouponType;
  discountValue: number;
  minimumAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  timesUsed: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string | null;
}
