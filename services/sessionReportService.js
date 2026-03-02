const { prisma } = require('../lib/prisma');

/**
 * Get complete session details including memorization, revisions, and report.
 */
async function getSessionDetails(sessionId) {
    return prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            memorizations: { orderBy: { createdAt: 'asc' } },
            revisions: { orderBy: { createdAt: 'asc' } },
            report: true,
            booking: {
                include: {
                    student: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true, phone: true, avatar: true } },
                    teacher: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
                },
            },
        },
    });
}

// ─── Memorization ──────────────────────────────────────────────────────────────

async function saveMemorization(sessionId, dto) {
    // One memorization record per session (upsert on sessionId — create or add)
    return prisma.sessionMemorization.create({
        data: {
            sessionId,
            surahName: dto.surahName,
            surahNameAr: dto.surahNameAr || null,
            surahNumber: dto.surahNumber ? parseInt(dto.surahNumber) : null,
            fromAyah: dto.fromAyah ? parseInt(dto.fromAyah) : null,
            toAyah: dto.toAyah ? parseInt(dto.toAyah) : null,
            isFullSurah: Boolean(dto.isFullSurah),
            notes: dto.notes || null,
        },
    });
}

async function updateMemorization(memId, dto) {
    return prisma.sessionMemorization.update({
        where: { id: memId },
        data: {
            surahName: dto.surahName,
            surahNameAr: dto.surahNameAr || null,
            surahNumber: dto.surahNumber ? parseInt(dto.surahNumber) : null,
            fromAyah: dto.fromAyah ? parseInt(dto.fromAyah) : null,
            toAyah: dto.toAyah ? parseInt(dto.toAyah) : null,
            isFullSurah: Boolean(dto.isFullSurah),
            notes: dto.notes || null,
        },
    });
}

async function deleteMemorization(memId) {
    return prisma.sessionMemorization.delete({ where: { id: memId } });
}

async function getMemorizations(sessionId) {
    return prisma.sessionMemorization.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
}

// ─── Revision ──────────────────────────────────────────────────────────────────

async function saveRevision(sessionId, dto) {
    return prisma.sessionRevision.create({
        data: {
            sessionId,
            revisionType: dto.revisionType,  // 'CLOSE' | 'FAR'
            rangeType: dto.rangeType,          // 'SURAH' | 'JUZ' | 'QUARTER'
            fromSurah: dto.fromSurah || null,
            toSurah: dto.toSurah || null,
            fromJuz: dto.fromJuz ? parseInt(dto.fromJuz) : null,
            toJuz: dto.toJuz ? parseInt(dto.toJuz) : null,
            fromQuarter: dto.fromQuarter || null,
            toQuarter: dto.toQuarter || null,
            notes: dto.notes || null,
        },
    });
}

async function updateRevision(revId, dto) {
    return prisma.sessionRevision.update({
        where: { id: revId },
        data: {
            revisionType: dto.revisionType,
            rangeType: dto.rangeType,
            fromSurah: dto.fromSurah || null,
            toSurah: dto.toSurah || null,
            fromJuz: dto.fromJuz ? parseInt(dto.fromJuz) : null,
            toJuz: dto.toJuz ? parseInt(dto.toJuz) : null,
            fromQuarter: dto.fromQuarter || null,
            toQuarter: dto.toQuarter || null,
            notes: dto.notes || null,
        },
    });
}

async function deleteRevision(revId) {
    return prisma.sessionRevision.delete({ where: { id: revId } });
}

async function getRevisions(sessionId) {
    return prisma.sessionRevision.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });
}

// ─── Session Report / Evaluation ───────────────────────────────────────────────

async function saveReport(sessionId, teacherId, studentId, dto) {
    return prisma.sessionReport.upsert({
        where: { sessionId },
        create: {
            sessionId,
            teacherId,
            studentId,
            content: dto.content,
            rating: dto.rating ? parseInt(dto.rating) : null,
        },
        update: {
            content: dto.content,
            rating: dto.rating ? parseInt(dto.rating) : null,
        },
    });
}

async function getReport(sessionId) {
    return prisma.sessionReport.findUnique({ where: { sessionId } });
}

module.exports = {
    getSessionDetails,
    saveMemorization,
    updateMemorization,
    deleteMemorization,
    getMemorizations,
    saveRevision,
    updateRevision,
    deleteRevision,
    getRevisions,
    saveReport,
    getReport,
};
