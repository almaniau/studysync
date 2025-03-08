require('../backend/src/config/db');
const User = require('../backend/src/models/User');
const StudyGuide = require('../backend/src/models/StudyGuide');

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Delete all users
    await User.deleteMany({});
    console.log('✓ Users deleted');
    
    // Delete all study guides
    await StudyGuide.deleteMany({});
    console.log('✓ Study guides deleted');
    
    console.log('\nDatabase reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    process.exit(0);
  }
}

resetDatabase(); 