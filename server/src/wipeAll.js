import mongoose from 'mongoose';

const wipeDatabases = async () => {
  const dbNames = ['kabpro', 'fleetos'];
  const preservedEmails = ['sundan@gmail.com', 'admin@fleetos.com'];

  for (const dbName of dbNames) {
    try {
      const conn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`).asPromise();
      const collections = await conn.db.listCollections().toArray();
      
      console.log(`🧹 Cleaning database: ${dbName}`);
      for (const col of collections) {
        if (col.name === 'users') {
          const res = await conn.db.collection('users').deleteMany({
            email: { $nin: preservedEmails }
          });
          console.log(`   - users: deleted non-admin users (${res.deletedCount})`);
        } else {
          const res = await conn.db.collection(col.name).deleteMany({});
          console.log(`   - ${col.name}: cleared all (${res.deletedCount} docs)`);
        }
      }
      await conn.close();
      console.log(`✅ ${dbName} completely cleared for a brand new user.\n`);
    } catch (err) {
      console.error(`Error wiping ${dbName}:`, err);
    }
  }

  process.exit(0);
};

wipeDatabases();
