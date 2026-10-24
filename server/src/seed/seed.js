require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const sampleData = require('./sampleQuiz.json');

async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wayground';
  console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB.');

    // Look for existing quiz with same title
    const existing = await Quiz.findOne({ title: sampleData.title });
    if (existing) {
      console.log(`[Seed] Quiz "${sampleData.title}" already exists with ${existing.questions.length} questions. Updating questions...`);
      existing.questions = sampleData.questions;
      existing.description = sampleData.description;
      await existing.save();
      console.log(`[Seed] Updated quiz ID: ${existing._id}`);
    } else {
      const created = await Quiz.create(sampleData);
      console.log(`[Seed] Successfully seeded quiz "${created.title}" with ${created.questions.length} questions! (ID: ${created._id})`);
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seed] Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
