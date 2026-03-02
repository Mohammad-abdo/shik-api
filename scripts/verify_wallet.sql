SELECT COUNT(*) as session_count FROM sessions;
SELECT tw.teacherId, tw.balance, tw.totalEarned, tw.totalHours, t.hourlyRate
FROM teacher_wallets tw
JOIN teachers t ON t.id = tw.teacherId
WHERE t.teacherType = 'FULL_TEACHER';
SELECT type, COUNT(*) as count, SUM(amount) as total_amount
FROM wallet_transactions GROUP BY type;
