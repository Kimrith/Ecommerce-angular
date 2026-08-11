export interface SellerForm {
    userId?: number | string;
    firstName: string; // Changed from fullName
    lastName: string;  // Added lastName
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    shopName: string;
    role: string;
    status: string;
    address: string;
    image: File | null;
}