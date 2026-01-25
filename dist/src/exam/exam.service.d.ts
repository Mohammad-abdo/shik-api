import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, AddQuestionDto, SubmitExamDto } from './dto';
export declare class ExamService {
    private prisma;
    constructor(prisma: PrismaService);
    createExam(dto: CreateExamDto, teacherId: string): Promise<{
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    }>;
    addQuestion(examId: string, dto: AddQuestionDto, teacherId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        type: string;
        question: string;
        questionText: string | null;
        questionType: string | null;
        options: string | null;
        correctAnswer: string | null;
        points: number;
        marks: number | null;
        examId: string;
    }>;
    publishExam(examId: string, teacherId: string): Promise<{
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    }>;
    getExam(examId: string, userId: string): Promise<{
        submission: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            examId: string;
            timeSpent: number | null;
            score: number | null;
            totalPoints: number | null;
            obtainedMarks: number | null;
            submittedAt: Date | null;
            gradedAt: Date | null;
            feedback: string | null;
        };
        canSubmit: boolean;
        teacher: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            type: string;
            question: string;
            questionText: string | null;
            questionType: string | null;
            options: string | null;
            correctAnswer: string | null;
            points: number;
            marks: number | null;
            examId: string;
        }[];
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    } | {
        canSubmit: boolean;
        teacher: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            order: number;
            type: string;
            question: string;
            questionText: string | null;
            questionType: string | null;
            options: string | null;
            correctAnswer: string | null;
            points: number;
            marks: number | null;
            examId: string;
        }[];
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    }>;
    submitExam(examId: string, dto: SubmitExamDto, studentId: string): Promise<{
        submission: {
            obtainedMarks: number;
            totalPoints: number;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            examId: string;
            timeSpent: number | null;
            score: number | null;
            submittedAt: Date | null;
            gradedAt: Date | null;
            feedback: string | null;
        };
        answers: any[];
    }>;
    gradeExam(examId: string, submissionId: string, teacherId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        examId: string;
        timeSpent: number | null;
        score: number | null;
        totalPoints: number | null;
        obtainedMarks: number | null;
        submittedAt: Date | null;
        gradedAt: Date | null;
        feedback: string | null;
    }>;
    getExamResults(examId: string, teacherId: string): Promise<{
        exam: {
            teacher: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
        } & {
            id: string;
            status: string | null;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            duration: number | null;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            title: string;
            isPublished: boolean;
            totalMarks: number | null;
            passingMarks: number | null;
        };
        submissions: ({
            student: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            answers: ({
                question: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    order: number;
                    type: string;
                    question: string;
                    questionText: string | null;
                    questionType: string | null;
                    options: string | null;
                    correctAnswer: string | null;
                    points: number;
                    marks: number | null;
                    examId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                questionId: string;
                answerText: string | null;
                isCorrect: boolean | null;
                pointsAwarded: number | null;
                marksObtained: number | null;
                submissionId: string;
            })[];
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            examId: string;
            timeSpent: number | null;
            score: number | null;
            totalPoints: number | null;
            obtainedMarks: number | null;
            submittedAt: Date | null;
            gradedAt: Date | null;
            feedback: string | null;
        })[];
        statistics: {
            totalSubmissions: number;
            averageScore: number;
            passedCount: number;
        };
    }>;
    getStudentExams(studentId: string): Promise<{
        submitted: boolean;
        submission: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            examId: string;
            timeSpent: number | null;
            score: number | null;
            totalPoints: number | null;
            obtainedMarks: number | null;
            submittedAt: Date | null;
            gradedAt: Date | null;
            feedback: string | null;
        };
        teacher: {
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            introVideoUrl: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        _count: {
            submissions: number;
        };
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    }[]>;
    getTeacherExams(teacherId: string): Promise<({
        _count: {
            questions: number;
            submissions: number;
        };
    } & {
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        duration: number | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        isPublished: boolean;
        totalMarks: number | null;
        passingMarks: number | null;
    })[]>;
}
