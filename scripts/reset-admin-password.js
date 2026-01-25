const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    const adminEmail = 'admin@shaykhi.com';
    const newPassword = 'admin123';
    
    // Find admin user
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (!admin) {
      console.log('❌ Admin user not found! Creating admin user...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
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
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('✅ Admin user found:', admin.email);
      
      // Reset password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          status: 'ACTIVE', // Ensure status is ACTIVE
        },
      });
      console.log('✅ Password reset successfully');
    }
    
    // Verify the password works
    const testPassword = await bcrypt.compare(newPassword, admin.password);
    console.log('Password verification:', testPassword ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n📝 Login Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', newPassword);
    console.log('Status:', admin.status);
    console.log('Role:', admin.role);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();




