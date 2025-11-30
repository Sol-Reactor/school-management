import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log('Attempting to reset admin password...');

  const adminEmail = 'admin@school.com';
  const newPassword = 'password123'; // The new password

  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    let user = adminUser;

    if (!user) {
      console.log(`Admin user with email '${adminEmail}' not found. Creating a new admin user.`);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          fullName: 'Admin User', // Default full name for the new admin
          role: 'ADMIN',
        },
      });
      console.log('New admin user created successfully.');
    } else {
      console.log(`Admin user '${user.fullName}' found. Proceeding to reset password.`);
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    console.log('New password has been hashed.');

    // Update the user's password in the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash },
    });

    console.log('✅ Admin password has been successfully reset!');
    console.log(`You can now log in as '${adminEmail}' with the password '${newPassword}'.`);

  } catch (error) {
    console.error('An error occurred during the password reset process:', error);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('Disconnected from database.');
  }
}

resetAdminPassword();
