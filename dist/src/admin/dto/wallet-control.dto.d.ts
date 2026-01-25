export declare class DepositToWalletDto {
    studentId: string;
    amount: number;
    description?: string;
    paymentMethod?: string;
}
export declare class WithdrawFromWalletDto {
    studentId: string;
    amount: number;
    description?: string;
}
export declare class ProcessPaymentDto {
    studentId: string;
    amount: number;
    paymentType: string;
    relatedId?: string;
    description?: string;
    paymentMethod?: string;
}
