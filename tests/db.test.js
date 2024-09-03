/* eslint-disable jest/valid-expect */
/* eslint-disable no-undef */
/* eslint-disable jest/prefer-expect-assertions */
const { expect } = require('chai');
const dbClient = require('../utils/db');

describe('dbClient', () => {
  it('should be to alive', async () => {
    expect(dbClient.isAlive()).to.be.an('boolean');
  });

  it('should return users count', async () => {
    const usersCount = await dbClient.nbUsers();
    expect(usersCount).to.be.a('number');
  });

  it('should return file count', async () => {
    const filesCount = await dbClient.nbFiles();
    expect(filesCount).to.be.a('number');
  });
});
