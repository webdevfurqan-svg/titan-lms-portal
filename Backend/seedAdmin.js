// require('dotenv').config();
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('./models/User');

// // Edit these three values before running, then run this file with:
// //   node seedAdmin.js
// // Safe to re-run any time — if the account already exists, it UPDATES
// // the password to match ADMIN_PASSWORD below instead of skipping.
// const ADMIN_NAME = 'Titan Admin';
// const ADMIN_EMAIL = 'admin@titanlms.com';
// const ADMIN_PASSWORD = 'admin666';

// async function run() {
//   await mongoose.connect(process.env.MONGO_URI);

//   const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

//   const existing = await User.findOne({ email: ADMIN_EMAIL });

//   if (existing) {
//     existing.password = hashed;
//     existing.name = ADMIN_NAME;
//     await existing.save();
//     console.log('Existing admin account updated with new password.');
//   } else {
//     await User.create({
//       name: ADMIN_NAME,
//       email: ADMIN_EMAIL,
//       password: hashed,
//       role: 'admin',
//     });
//     console.log('Admin account created successfully.');
//   }

//   console.log('Email:', ADMIN_EMAIL);
//   console.log('Password:', ADMIN_PASSWORD);

//   await mongoose.disconnect();
// }

// run().catch((err) => {
//   console.error('Failed to create/update admin:', err.message);
//   process.exit(1);
// });

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@titanlms.com';
const ADMIN_PASSWORD = 'admin666';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({ email: { $regex: new RegExp('^admin@titanlms\\.com$', 'i') } });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    name: 'Titan Admin',
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  console.log('✅ Admin account seeded successfully!');
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});