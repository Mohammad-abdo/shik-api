export declare enum QuestionType {
    MCQ = "MCQ",
    TRUE_FALSE = "TRUE_FALSE",
    WRITTEN = "WRITTEN"
}
export declare class AddQuestionDto {
    questionText: string;
    questionType: QuestionType;
    marks: number;
    options?: string[];
    correctAnswer?: string;
}
