import mongoose from 'mongoose';
import User from './models/User.js';
import demoData from './demoData.json' with { type: 'json' };

import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  let connected = false;
  const mongoURI = process.env.MONGO_URI;

  if (mongoURI) {
    try {
      console.log('Connecting to MongoDB Atlas Cluster...');
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 4000 });
      console.log('MongoDB Connected to Cloud/Atlas Cluster successfully!');
      connected = true;
    } catch (error) {
      console.warn('Could not reach Atlas cluster (outbound port 27017 might be blocked by your network/ISP).');
      console.log('Switching to embedded in-memory MongoDB so your app runs with zero downtime...');
    }
  }

  if (!connected) {
    try {
      const mongoServer = await MongoMemoryServer.create();
      const localURI = mongoServer.getUri();
      await mongoose.connect(localURI);
      console.log(`MongoDB Connected (In-Memory Database ready) at ${localURI}`);
    } catch (err) {
      console.error(`Fatal MongoDB error: ${err.message}`);
      process.exit(1);
    }
  }

  // Seed database if empty
  await seedDatabase();
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
