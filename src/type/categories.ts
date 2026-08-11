export interface Category {
    id: number;
    name: string;
    slug: string;
    status: string;
    description: string;
    imageUrl: string | null;
    productCount: number;
    userId: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateCategoryRequest {
    name: string;
    slug?: string;
    description: string;
    status: number | string;
    image?: File | null;
}

export interface CategoryStatistics {
    totalCategories: number;
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
    suspended: number;
}