const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking admin user...');
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@shaykhi.com' },
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Creating admin user...');
      
      const adminPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@shaykhi.com',
          password: adminPassword,
          firstName: 'Admin',
          firstNameAr: 'مدير',
          lastName: 'User',
          lastNameAr: 'النظام',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: true,
          phone: '+201000000000',
        },
      });
      console.log('✅ Admin user created:', newAdmin.email);
    } else {
      console.log('✅ Admin user found:', admin.email);
      console.log('Status:', admin.status);
      console.log('Role:', admin.role);
      
      // Test password
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('Password test (admin123):', isValid ? '✅ Valid' : '❌ Invalid');
      
      if (!isValid) {
        console.log('⚠️  Password mismatch! Resetting password...');
        const newPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: newPassword },
        });
        console.log('✅ Password reset to: admin123');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();




