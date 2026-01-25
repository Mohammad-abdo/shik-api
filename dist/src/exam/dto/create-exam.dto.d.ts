export declare enum ExamStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    CLOSED = "CLOSED"
}
export declare class CreateExamDto {
    title: string;
    description?: string;
    duration: number;
    totalMarks?: number;
    passingMarks?: number;
    status?: ExamStatus;
    startDate?: string;
    endDate?: string;
}
