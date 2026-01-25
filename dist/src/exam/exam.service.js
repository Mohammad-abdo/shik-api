"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamService = class ExamService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createExam(dto, teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const exam = await this.prisma.exam.create({
            data: {
                teacherId: teacher.id,
                title: dto.title,
                description: dto.description,
                duration: dto.duration,
                totalMarks: dto.totalMarks || 0,
                passingMarks: dto.passingMarks,
                status: dto.status || 'DRAFT',
                startDate: dto.startDate,
                endDate: dto.endDate,
            },
        });
        return exam;
    }
    async addQuestion(examId, dto, teacherId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { teacher: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.teacher.userId !== teacherId) {
            throw new common_1.ForbiddenException('You are not authorized to modify this exam');
        }
        const questionCount = await this.prisma.question.count({
            where: { examId },
        });
        const question = await this.prisma.question.create({
            data: {
                examId,
                question: dto.questionText,
                questionText: dto.questionText,
                type: dto.questionType,
                questionType: dto.questionType,
                points: dto.marks,
                marks: dto.marks,
                order: questionCount + 1,
                options: dto.options ? JSON.stringify(dto.options) : null,
                correctAnswer: dto.correctAnswer,
            },
        });
        await this.prisma.exam.update({
            where: { id: examId },
            data: {
                totalMarks: {
                    increment: dto.marks,
                },
            },
        });
        return question;
    }
    async publishExam(examId, teacherId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { teacher: true, questions: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.teacher.userId !== teacherId) {
            throw new common_1.ForbiddenException('You are not authorized to publish this exam');
        }
        if (exam.questions.length === 0) {
            throw new common_1.BadRequestException('Cannot publish exam without questions');
        }
        return this.prisma.exam.update({
            where: { id: examId },
            data: {
                status: 'PUBLISHED',
                startDate: exam.startDate || new Date(),
            },
        });
    }
    async getExam(examId, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                questions: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (user.role === 'STUDENT') {
            const submission = await this.prisma.examSubmission.findUnique({
                where: {
                    examId_studentId: {
                        examId,
                        studentId: userId,
                    },
                },
            });
            if (submission) {
                return {
                    ...exam,
                    submission,
                    canSubmit: false,
                };
            }
        }
        if (user.role !== 'TEACHER' && exam.status !== 'GRADED') {
            exam.questions = exam.questions.map((q) => ({
                ...q,
                correctAnswer: undefined,
            }));
        }
        return {
            ...exam,
            canSubmit: user.role === 'STUDENT' && exam.status === 'PUBLISHED',
        };
    }
    async submitExam(examId, dto, studentId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.status !== 'PUBLISHED') {
            throw new common_1.BadRequestException('Exam is not available for submission');
        }
        const existingSubmission = await this.prisma.examSubmission.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId,
                },
            },
        });
        if (existingSubmission) {
            throw new common_1.BadRequestException('Exam already submitted');
        }
        const submission = await this.prisma.examSubmission.create({
            data: {
                exam: { connect: { id: examId } },
                student: { connect: { id: studentId } },
                timeSpent: dto.timeSpent,
                totalPoints: exam.totalMarks || 0,
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
        });
        let totalMarks = 0;
        const answers = [];
        for (const answer of dto.answers) {
            const question = exam.questions.find((q) => q.id === answer.questionId);
            if (!question)
                continue;
            let isCorrect = false;
            let marksObtained = 0;
            if (question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE') {
                isCorrect = answer.answerText === question.correctAnswer;
                marksObtained = isCorrect ? question.marks : 0;
                totalMarks += marksObtained;
            }
            const answerRecord = await this.prisma.answer.create({
                data: {
                    submissionId: submission.id,
                    questionId: answer.questionId,
                    answerText: answer.answerText,
                    isCorrect,
                    marksObtained,
                },
            });
            answers.push(answerRecord);
        }
        await this.prisma.examSubmission.update({
            where: { id: submission.id },
            data: {
                obtainedMarks: totalMarks,
                totalPoints: exam.totalMarks || 0,
            },
        });
        return {
            submission: {
                ...submission,
                obtainedMarks: totalMarks,
                totalPoints: exam.totalMarks || 0,
            },
            answers,
        };
    }
    async gradeExam(examId, submissionId, teacherId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { teacher: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.teacher.userId !== teacherId) {
            throw new common_1.ForbiddenException('You are not authorized to grade this exam');
        }
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: {
                answers: {
                    include: {
                        question: true,
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        let totalMarks = submission.obtainedMarks || 0;
        for (const answer of submission.answers) {
            if (answer.question.questionType === 'WRITTEN' && !answer.marksObtained) {
                totalMarks += answer.marksObtained || 0;
            }
        }
        const updatedSubmission = await this.prisma.examSubmission.update({
            where: { id: submissionId },
            data: {
                obtainedMarks: totalMarks,
                status: 'GRADED',
                gradedAt: new Date(),
            },
        });
        return updatedSubmission;
    }
    async getExamResults(examId, teacherId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: { teacher: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.teacher.userId !== teacherId) {
            throw new common_1.ForbiddenException('You are not authorized to view these results');
        }
        const submissions = await this.prisma.examSubmission.findMany({
            where: { examId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                answers: {
                    include: {
                        question: true,
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
        return {
            exam,
            submissions,
            statistics: {
                totalSubmissions: submissions.length,
                averageScore: submissions.length > 0
                    ? submissions.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0) / submissions.length
                    : 0,
                passedCount: exam.passingMarks
                    ? submissions.filter((s) => (s.obtainedMarks || 0) >= exam.passingMarks).length
                    : 0,
            },
        };
    }
    async getStudentExams(studentId) {
        const exams = await this.prisma.exam.findMany({
            where: {
                status: 'PUBLISHED',
                AND: [
                    {
                        OR: [
                            { startDate: { lte: new Date() } },
                            { startDate: null },
                        ],
                    },
                    {
                        OR: [
                            { endDate: { gte: new Date() } },
                            { endDate: null },
                        ],
                    },
                ],
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const examsWithStatus = await Promise.all(exams.map(async (exam) => {
            const submission = await this.prisma.examSubmission.findUnique({
                where: {
                    examId_studentId: {
                        examId: exam.id,
                        studentId,
                    },
                },
            });
            return {
                ...exam,
                submitted: !!submission,
                submission,
            };
        }));
        return examsWithStatus;
    }
    async getTeacherExams(teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const exams = await this.prisma.exam.findMany({
            where: { teacherId: teacher.id },
            include: {
                _count: {
                    select: {
                        questions: true,
                        submissions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return exams;
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamService);
//# sourceMappingURL=exam.service.js.map