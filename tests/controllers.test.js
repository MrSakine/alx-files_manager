/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/valid-expect */
/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const request = require('request');
const { promisify } = require('util');

const PORT = process.env.PORT || 1234;
const baseUrl = `http://localhost:${PORT}`;
const requestGet = promisify(request.get);
const requestPost = promisify(request.post);

describe('controller tests', () => {
  let authToken;

  describe('get app status', () => {
    it('should return the status of Redis and MongoDB', async () => {
      try {
        const response = await requestGet({
          url: `${baseUrl}/status`,
          json: true,
        });

        expect(response.body).to.have.property('redis');
        expect(response.body).to.have.property('db');
        expect(response.body.redis).to.be.a('boolean');
        expect(response.body.db).to.be.a('boolean');
      } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });

  describe('get app stats', () => {
    it('should return the counts of users and files', async () => {
      try {
        const response = await requestGet({
          url: `${baseUrl}/stats`,
          json: true,
        });

        expect(response.body).to.have.property('users');
        expect(response.body).to.have.property('files');
        expect(response.body.users).to.be.a('number');
        expect(response.body.files).to.be.a('number');
      } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });

  describe('create a new users', () => {
    it('should create a new user', async () => {
      try {
        const response = await requestPost({
          url: `${baseUrl}/users`,
          body: {
            email: 'testuser2@example.com',
            password: 'securepassword',
          },
          json: true,
        });

        expect(response).to.have.property('statusCode');
        expect(response.statusCode).to.equal(201);

        expect(response.body).to.have.property('email');
        expect(response.body.email).to.equal('testuser2@example.com');
      } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });

  describe('login a user', () => {
    it('should log in the user and return a token', async () => {
      try {
        const auth = Buffer.from('testuser2@example.com:securepassword').toString('base64');
        const response = await requestGet({
          url: `${baseUrl}/connect`,
          headers: {
            Authorization: `Basic ${auth}`,
          },
          json: true,
        });

        expect(response).to.have.property('statusCode');
        expect(response.statusCode).to.equal(200);

        expect(response.body).to.have.property('token');
        authToken = response.body.token;
      } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });

  describe('get user info', () => {
    it('should return user information', async () => {
      try {
        const response = await requestGet({
          url: `${baseUrl}/users/me`,
          headers: {
            'x-token': authToken,
          },
          json: true,
        });

        expect(response).to.have.property('statusCode');
        expect(response.statusCode).to.equal(200);

        expect(response.body).to.have.property('email');
        expect(response.body.email).to.equal('testuser2@example.com');
      } catch (error) {
        console.error('Error during GET /users/me request:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });

  describe('disconnect a user', () => {
    it('should log out the user', async () => {
      try {
        const response = await requestGet({
          url: `${baseUrl}/disconnect`,
          headers: {
            'x-token': authToken,
          },
          json: true,
        });

        expect(response).to.have.property('statusCode');
        expect(response.statusCode).to.equal(204);
      } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
      }
    });
  });
});
