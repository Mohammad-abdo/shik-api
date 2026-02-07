const { prisma } = require('../lib/prisma');

async function createExam(dto, teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  return prisma.exam.create({
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
}

async function addQuestion(examId, dto, teacherId) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { teacher: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  if (exam.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const count = await prisma.question.count({ where: { examId } });
  const question = await prisma.question.create({
    data: {
      examId,
      question: dto.questionText,
      questionText: dto.questionText,
      type: dto.questionType,
      questionType: dto.questionType,
      points: dto.marks,
      marks: dto.marks,
      order: count + 1,
      options: dto.options ? JSON.stringify(dto.options) : null,
      correctAnswer: dto.correctAnswer,
    },
  });
  await prisma.exam.update({ where: { id: examId }, data: { totalMarks: { increment: dto.marks } } });
  return question;
}

async function publishExam(examId, teacherId) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { teacher: true, questions: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  if (exam.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  if (exam.questions.length === 0) throw Object.assign(new Error('Cannot publish exam without questions'), { statusCode: 400 });
  return prisma.exam.update({ where: { id: examId }, data: { status: 'PUBLISHED', startDate: exam.startDate || new Date() } });
}

async function deleteExam(examId, teacherId) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { teacher: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  if (exam.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const submissionIds = (await prisma.examSubmission.findMany({ where: { examId }, select: { id: true } })).map((r) => r.id);
  if (submissionIds.length > 0) await prisma.answer.deleteMany({ where: { submissionId: { in: submissionIds } } });
  await prisma.examSubmission.deleteMany({ where: { examId } });
  await prisma.question.deleteMany({ where: { examId } });
  await prisma.exam.delete({ where: { id: examId } });
  return { message: 'Exam deleted successfully' };
}

async function getExam(examId, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } }, questions: { orderBy: { order: 'asc' } } },
  });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  let submission;
  if (user.role === 'STUDENT') {
    submission = await prisma.examSubmission.findUnique({ where: { examId_studentId: { examId, studentId: userId } } });
  }
  let canSubmit = user.role === 'STUDENT' && exam.status === 'PUBLISHED' && !submission;
  if (user.role !== 'TEACHER' && exam.status !== 'GRADED') {
    exam.questions = exam.questions.map((q) => ({ ...q, correctAnswer: undefined }));
  }
  return { ...exam, submission, canSubmit };
}

async function submitExam(examId, dto, studentId) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  if (exam.status !== 'PUBLISHED') throw Object.assign(new Error('Exam is not available for submission'), { statusCode: 400 });
  const existing = await prisma.examSubmission.findUnique({ where: { examId_studentId: { examId, studentId } } });
  if (existing) throw Object.assign(new Error('Exam already submitted'), { statusCode: 400 });
  const submission = await prisma.examSubmission.create({
    data: { examId, studentId, timeSpent: dto.timeSpent, totalPoints: exam.totalMarks || 0, status: 'SUBMITTED', submittedAt: new Date() },
  });
  let totalMarks = 0;
  const answers = [];
  for (const answer of dto.answers || []) {
    const question = exam.questions.find((q) => q.id === answer.questionId);
    if (!question) continue;
    let isCorrect = false;
    let marksObtained = 0;
    if (question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE') {
      isCorrect = answer.answerText === question.correctAnswer;
      marksObtained = isCorrect ? (question.marks || 0) : 0;
      totalMarks += marksObtained;
    }
    const answerRecord = await prisma.answer.create({
      data: { submissionId: submission.id, questionId: answer.questionId, answerText: answer.answerText, isCorrect, marksObtained },
    });
    answers.push(answerRecord);
  }
  await prisma.examSubmission.update({ where: { id: submission.id }, data: { obtainedMarks: totalMarks, totalPoints: exam.totalMarks || 0 } });
  return { submission: { ...submission, obtainedMarks: totalMarks, totalPoints: exam.totalMarks || 0 }, answers };
}

async function getResults(examId, userId) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { teacher: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  const submissions = await prisma.examSubmission.findMany({
    where: { examId },
    include: { student: { select: { id: true, firstName: true, lastName: true, email: true } }, answers: { include: { question: true } } },
    orderBy: { submittedAt: 'desc' },
  });
  return { exam, submissions };
}

async function gradeExam(examId, submissionId, teacherId, dto) {
  const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { teacher: true } });
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  if (exam.teacher.userId !== teacherId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId }, include: { answers: { include: { question: true } } } });
  if (!submission) throw Object.assign(new Error('Submission not found'), { statusCode: 404 });
  const obtainedMarks = dto?.obtainedMarks != null ? dto.obtainedMarks : (submission.obtainedMarks || 0);
  const updated = await prisma.examSubmission.update({
    where: { id: submissionId },
    data: { status: 'GRADED', gradedAt: new Date(), obtainedMarks, feedback: dto?.feedback },
  });
  return updated;
}

async function getStudentMyExams(studentId) {
  return prisma.examSubmission.findMany({
    where: { studentId },
    include: { exam: { include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
    orderBy: { submittedAt: 'desc' },
  });
}

async function getTeacherMyExams(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];
  return prisma.exam.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { questions: true, submissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { createExam, addQuestion, publishExam, deleteExam, getExam, submitExam, getResults, gradeExam, getStudentMyExams, getTeacherMyExams };
