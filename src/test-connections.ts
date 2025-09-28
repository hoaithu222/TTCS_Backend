import { checkConnections, closeConnections } from './shared/config/connections';

// Test all database connections
const testConnections = async () => {
  console.log('🔍 Testing database connections...');
  
  try {
    const result = await checkConnections();
    
    if (result) {
      console.log('✅ All connections successful!');
      console.log('📊 Ready to start server');
    } else {
      console.log('❌ Some connections failed');
    }
    
    // Close connections after test
    await closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
};

// Run the test
testConnections(); 