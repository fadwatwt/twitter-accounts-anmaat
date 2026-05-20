/**
 * One-off migration: drop the old `accountcategories` collection so the
 * subscriber-scoped schema (subscriber_id + compound unique index on
 * {subscriber_id, name}) can take over cleanly. Also drops any Twitter
 * accounts that referenced now-deleted categories (Category is a required ref).
 *
 * Usage:
 *   DRY_RUN=true  node scripts/migrateCategoriesPerSubscriber.js   (default — no writes)
 *   DRY_RUN=false node scripts/migrateCategoriesPerSubscriber.js   (destructive)
 *
 * This is safe to re-run; it is idempotent once the old indexes/data are gone.
 */
require('dotenv').config({ path: 'config.env' });
const mongoose = require('mongoose');

const DRY_RUN = String(process.env.DRY_RUN || 'true').toLowerCase() !== 'false';

(async () => {
  const uri = process.env.DB_URI;
  if (!uri) {
    console.error('DB_URI is missing from config.env');
    process.exit(1);
  }

  console.log(`[migrate] connecting to ${uri.replace(/:[^:@]+@/, ':***@')}`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const hasCategories = collections.some((c) => c.name === 'accountcategories');
  const hasAccounts = collections.some((c) => c.name === 'accounts');

  if (!hasCategories) {
    console.log('[migrate] accountcategories collection does not exist — nothing to drop');
  } else {
    const oldCount = await db.collection('accountcategories').countDocuments();
    console.log(`[migrate] found ${oldCount} existing categories`);

    if (DRY_RUN) {
      console.log('[migrate] DRY_RUN=true → would drop accountcategories collection');
    } else {
      await db.collection('accountcategories').drop();
      console.log('[migrate] dropped accountcategories collection');
    }
  }

  if (hasAccounts) {
    // Accounts whose Category no longer exists become orphans (Category is required).
    // Find them by looking for accounts whose Category id has no matching doc.
    const orphanIds = await db.collection('accounts').aggregate([
      {
        $lookup: {
          from: 'accountcategories',
          localField: 'Category',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $match: { cat: { $size: 0 } } },
      { $project: { _id: 1 } },
    ]).toArray();

    console.log(`[migrate] found ${orphanIds.length} orphan tweet accounts (Category missing)`);

    if (orphanIds.length > 0) {
      if (DRY_RUN) {
        console.log('[migrate] DRY_RUN=true → would delete orphan accounts');
      } else {
        const ids = orphanIds.map((x) => x._id);
        const result = await db.collection('accounts').deleteMany({ _id: { $in: ids } });
        console.log(`[migrate] deleted ${result.deletedCount} orphan accounts`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('[migrate] done');
})().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
