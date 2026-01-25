export declare class AnswerDto {
    questionId: string;
    answerText: string;
}
export declare class SubmitExamDto {
    answers: AnswerDto[];
    timeSpent?: number;
}
