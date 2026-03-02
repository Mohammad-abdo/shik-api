const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sessionCount = await prisma.session.count();
    console.log(`\n✅ Sessions in DB: ${sessionCount}`);

    const wallets = await prisma.teacherWallet.findMany({
        include: { teacher: { select: { hourlyRate: true, teacherType: true } } },
        where: { teacher: { teacherType: 'FULL_TEACHER' } },
    });
    console.log('\n✅ FULL_TEACHER Wallets:');
    for (const w of wallets) {
        console.log(`  balance=${w.balance.toFixed(2)}  totalEarned=${w.totalEarned.toFixed(2)}  totalHours=${w.totalHours.toFixed(2)}  hourlyRate=${w.teacher.hourlyRate}`);
    }

    const txByType = await prisma.$queryRaw`
    SELECT type, COUNT(*) as cnt, SUM(amount) as total FROM wallet_transactions GROUP BY type
  `;
    console.log('\n✅ WalletTransaction by type:');
    for (const row of txByType) {
        console.log(`  type=${row.type}  count=${row.cnt}  total=${Number(row.total).toFixed(2)}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
