export interface Banner {
    id: number;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    targetUrl?: string;
    position: string;
    displayOrder: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdAt: string;
}