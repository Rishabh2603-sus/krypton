import mongoose from 'mongoose';
import User from './models/User.js';
import demoData from './demoData.json' with { type: 'json' };

import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoURI = mongoServer.getUri();
    
    await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected to In-Memory Server at ${mongoURI}`);

    // Seed database if empty
    await seedDatabase();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Seeding initial demo data into MongoDB...');
      
      const usersToInsert = [];
      for (const [userId, data] of Object.entries(demoData)) {
        usersToInsert.push({
          userId,
          ...data
        });
      }

      await User.insertMany(usersToInsert);
      console.log('Database seeded successfully!');
    }
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

export default connectDB;
