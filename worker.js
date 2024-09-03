const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');

// eslint-disable-next-line consistent-return
fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }
  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const file = await dbClient.db.collection('files')
    .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

  if (!file) {
    return done(new Error('File not found'));
  }

  const sizes = [500, 250, 100];
  const { localPath } = file;

  try {
    await Promise.all(sizes.map(async (size) => {
      const thumbnail = await imageThumbnail(localPath, { width: size });
      const thumbnailPath = `${localPath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    }));

    done();
  } catch (err) {
    done(err);
  }
});
