const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users')
      .findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files')
        .findOne({
          _id: ObjectId(parentId),
        });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files')
        .insertOne(fileData);
      return res.status(201).json({
        id: result.insertedId,
        userId: result.ops[0].userId,
        name: result.ops[0].name,
        type: result.ops[0].type,
        isPublic: result.ops[0].isPublic,
        parentId: result.ops[0].parentId,
      });
    }

    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    const localPath = `${FOLDER_PATH}/${uuidv4()}`;
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    fileData.localPath = localPath;

    const result = await dbClient.db.collection('files')
      .insertOne(fileData);
    return res.status(201).json({
      id: result.insertedId,
      userId: result.ops[0].userId,
      name: result.ops[0].name,
      type: result.ops[0].type,
      isPublic: result.ops[0].isPublic,
      parentId: result.ops[0].parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files')
      .findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // eslint-disable-next-line prefer-destructuring
    let parentId = req.query.parentId;
    if (ObjectId.isValid(parentId)) {
      parentId = ObjectId(parentId);
    } else {
      parentId = 0;
    }
    let page = Number(req.query.page) || 0;
    if (Number.isNaN(page)) page = 0;
    const pageSize = 20;
    const skip = page * pageSize;
    const pipeline = [
      { $match: { parentId } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    try {
      const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();

      return res.status(200).json(files);
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = FilesController;
