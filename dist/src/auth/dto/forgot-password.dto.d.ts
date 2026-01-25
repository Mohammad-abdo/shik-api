export declare enum ForgotPasswordMethod {
    EMAIL = "EMAIL",
    PHONE = "PHONE"
}
export declare class ForgotPasswordDto {
    method: ForgotPasswordMethod;
    email?: string;
    phone?: string;
}
export declare class ResetPasswordDto {
    email?: string;
    phone?: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}
