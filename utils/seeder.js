require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  await User.deleteMany({});
  await Charity.deleteMany({});
  await Draw.deleteMany({});

  // Admin
  await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@golfcharity.com', password: process.env.ADMIN_PASSWORD || 'Admin@123456', role: 'admin', subscription: { status: 'active' } });

  // Charities
  const charityData = [
    { name: 'Hearts in Motion', description: 'Providing cardiac care to underprivileged communities worldwide.', shortDescription: 'Cardiac care for all.', category: 'health', isFeatured: true, isActive: true },
    { name: 'Green Futures', description: 'Planting trees and restoring ecosystems one acre at a time.', shortDescription: 'Reforestation and rewilding.', category: 'environment', isFeatured: true, isActive: true },
    { name: 'Education First', description: 'Building schools and funding scholarships in rural areas.', shortDescription: 'Every child deserves to learn.', category: 'education', isFeatured: false, isActive: true },
    { name: 'Sport for All', description: 'Making sport accessible to young people regardless of background.', shortDescription: 'Levelling the playing field.', category: 'sports', isFeatured: false, isActive: true },
    { name: 'Little Stars', description: 'Supporting children with disabilities through therapy and play.', shortDescription: 'Every child shines.', category: 'children', isFeatured: true, isActive: true },
  ];
  const charities = [];
  for (const data of charityData) {
    const charity = new Charity(data);
    await charity.save();
    charities.push(charity);
  }

  // Test subscriber
  const testUser = await User.create({
    name: 'Test Subscriber',
    email: 'test@golfcharity.com',
    password: 'Test@123456',
    role: 'subscriber',
    subscription: { status: 'active', plan: 'monthly', currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    selectedCharity: charities[0]._id,
    charityPercentage: 15,
    scores: [
      { score: 32, date: new Date('2026-03-20') },
      { score: 28, date: new Date('2026-03-13') },
      { score: 35, date: new Date('2026-03-06') },
      { score: 30, date: new Date('2026-02-28') },
      { score: 27, date: new Date('2026-02-21') },
    ],
    drawsEntered: 3,
    totalWon: 0,
  });

  console.log('✅ Seeded admin, charities, test user');
  console.log('Admin: admin@golfcharity.com / Admin@123456');
  console.log('Subscriber: test@golfcharity.com / Test@123456');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
