const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const testEmail = 'admin@shaykhi.com';
    const testPassword = 'admin123';
    
    console.log('🧪 Testing login flow...');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('');
    
    // Step 1: Normalize email (like in auth.service.ts)
    const normalizedEmail = testEmail.trim().toLowerCase();
    console.log('1️⃣ Normalized email:', normalizedEmail);
    
    // Step 2: Try exact match
    console.log('2️⃣ Searching for user with exact email match...');
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    
    if (!user) {
      console.log('   ⚠️  Exact match not found, trying case-insensitive search...');
      const allUsers = await prisma.user.findMany({
        select: { email: true, id: true },
      });
      console.log('   📋 All users in database:', allUsers.map(u => u.email));
      
      const matchingUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (matchingUser) {
        console.log('   ✅ Found user with case-insensitive match:', matchingUser.email);
        user = await prisma.user.findUnique({
          where: { id: matchingUser.id },
        });
      }
    }
    
    if (!user) {
      console.log('   ❌ User not found!');
      return;
    }
    
    console.log('   ✅ User found:', user.email);
    console.log('   Status:', user.status);
    console.log('   Role:', user.role);
    console.log('');
    
    // Step 3: Check password
    console.log('3️⃣ Checking password...');
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('   Password validation:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    if (!isPasswordValid) {
      console.log('   ❌ Password mismatch!');
      console.log('   Stored password hash:', user.password.substring(0, 20) + '...');
      return;
    }
    
    // Step 4: Check status
    console.log('4️⃣ Checking user status...');
    if (user.status !== 'ACTIVE') {
      console.log('   ❌ User status is not ACTIVE:', user.status);
      return;
    }
    console.log('   ✅ User is ACTIVE');
    console.log('');
    
    console.log('✅ Login test PASSED! All checks successful.');
    
  } catch (error) {
    console.error('❌ Error during login test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();




