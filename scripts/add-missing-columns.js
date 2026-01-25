const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('🔍 Checking for missing columns...');
    
    // Add missing columns to users table
    const userColumns = [
      { table: 'users', name: 'firstNameAr', type: 'VARCHAR(191)', nullable: true, after: 'firstName' },
      { table: 'users', name: 'lastNameAr', type: 'VARCHAR(191)', nullable: true, after: 'lastName' },
      { table: 'users', name: 'currentSurah', type: 'VARCHAR(191)', nullable: true },
      { table: 'users', name: 'currentSurahAr', type: 'VARCHAR(191)', nullable: true },
      { table: 'users', name: 'memorizationLevel', type: 'VARCHAR(191)', nullable: true },
      { table: 'users', name: 'memorizationLevelAr', type: 'VARCHAR(191)', nullable: true },
      { table: 'users', name: 'totalMemorized', type: 'INT', nullable: true, defaultValue: 0 },
    ];

    // Add missing columns to teachers table
    const teacherColumns = [
      { table: 'teachers', name: 'bioAr', type: 'VARCHAR(191)', nullable: true, after: 'bio' },
      { table: 'teachers', name: 'specialties', type: 'JSON', nullable: true },
      { table: 'teachers', name: 'specialtiesAr', type: 'JSON', nullable: true, after: 'specialties' },
      { table: 'teachers', name: 'readingType', type: 'VARCHAR(191)', nullable: true },
      { table: 'teachers', name: 'readingTypeAr', type: 'VARCHAR(191)', nullable: true, after: 'readingType' },
      { table: 'teachers', name: 'introVideoUrl', type: 'VARCHAR(191)', nullable: true },
      { table: 'teachers', name: 'certificates', type: 'JSON', nullable: true },
      { table: 'teachers', name: 'canIssueCertificates', type: 'BOOLEAN', nullable: true, defaultValue: false },
    ];

    const allColumns = [...userColumns, ...teacherColumns];

    for (const column of allColumns) {
      try {
        // Check if column exists
        const checkQuery = `
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = '${column.table}' 
          AND COLUMN_NAME = '${column.name}'
        `;
        
        const result = await prisma.$queryRawUnsafe(checkQuery);
        const exists = result[0].count > 0;

        if (!exists) {
          let alterQuery = `ALTER TABLE \`${column.table}\` ADD COLUMN \`${column.name}\` ${column.type}`;
          
          if (column.nullable === false) {
            alterQuery += ' NOT NULL';
          } else {
            alterQuery += ' NULL';
          }
          
          if (column.defaultValue !== undefined) {
            if (typeof column.defaultValue === 'boolean') {
              alterQuery += ` DEFAULT ${column.defaultValue ? 1 : 0}`;
            } else {
              alterQuery += ` DEFAULT ${column.defaultValue}`;
            }
          }
          
          if (column.after) {
            alterQuery += ` AFTER \`${column.after}\``;
          }

          console.log(`➕ Adding column ${column.table}.${column.name}...`);
          await prisma.$executeRawUnsafe(alterQuery);
          console.log(`✅ Added column ${column.table}.${column.name}`);
        } else {
          console.log(`✓ Column ${column.table}.${column.name} already exists`);
        }
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`✓ Column ${column.table}.${column.name} already exists`);
        } else {
          console.error(`❌ Error adding column ${column.table}.${column.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ All columns checked/added successfully!');
    console.log('📝 Next step: Run "npm run prisma:generate" to regenerate Prisma Client');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();

