export declare enum LoginMethod {
    EMAIL_PASSWORD = "EMAIL_PASSWORD",
    PHONE_PASSWORD = "PHONE_PASSWORD",
    PHONE_OTP = "PHONE_OTP",
    EMAIL_OTP = "EMAIL_OTP",
    GOOGLE = "GOOGLE"
}
export declare class LoginMultiDto {
    method: LoginMethod;
    email?: string;
    phone?: string;
    password?: string;
    otp?: string;
    googleToken?: string;
}
