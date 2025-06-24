const { getDatabase } = require('../config/database');

async function disable2FA() {
  try {
    const db = getDatabase();
    const email = 'houssemdaas2@gmail.com';
    
    console.log(`🔧 Disabling 2FA for email: ${email}`);
    
    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`📊 Current 2FA status: ${user.two_factor_enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!user.two_factor_enabled) {
      console.log(`ℹ️  2FA is already disabled for this user`);
      return;
    }
    
    // Disable 2FA and clear all related data
    await db.run(`
      UPDATE users 
      SET two_factor_enabled = 0,
          two_factor_secret = NULL,
          two_factor_backup_codes = NULL,
          two_factor_last_used = NULL,
          updated_at = ?
      WHERE email = ?
    `, [new Date().toISOString(), email]);
    
    console.log(`✅ 2FA has been disabled for ${email}`);
    console.log(`🔄 The user can now set up 2FA again from scratch`);
    console.log(`🎯 New backup codes will be numeric-only (8 digits each)`);
    
  } catch (error) {
    console.error('❌ Error disabling 2FA:', error);
  }
}

disable2FA();