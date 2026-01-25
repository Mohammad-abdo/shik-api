export type ReadingType = 'HAFS' | 'WARSH' | 'QALOON' | 'IBN_KATHIR' | 'ABU_AMR' | 'IBN_AMER' | 'ASIM' | 'HAMZA' | 'AL_KISAI' | 'YAQUB';
export declare class CreateTeacherDto {
    email: string;
    firstName: string;
    firstNameAr?: string;
    lastName: string;
    lastNameAr?: string;
    password: string;
    phone?: string;
    bio?: string;
    bioAr?: string;
    image?: string;
    experience?: number;
    hourlyRate?: number;
    specialties?: string[];
    specialtiesAr?: string[];
    readingType?: ReadingType;
    readingTypeAr?: string;
    introVideoUrl?: string;
    certificates?: string[];
    canIssueCertificates?: boolean;
    isApproved?: boolean;
}
