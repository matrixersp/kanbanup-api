const request = require('supertest');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');

let server;

describe('/api/users', () => {
  const password = '123456';
  const hash = bcrypt.hashSync(password, 10);

  const testUser = new User({
    name: 'User Name',
    email: 'email@domain.com',
    password: hash
  });

  beforeEach(async () => {
    server = require('../server');
  });

  afterEach(async () => {
    server.close();
    await User.deleteMany();
  });

  describe('GET /users/current', () => {
    it('should return the current user if the token is valid', async () => {
      await testUser.save();
      const token = testUser.genAuthToken();

      const res = await request(server)
        .get('/api/users/current')
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe(testUser.name);
      expect(res.body.email).toBe(testUser.email);
    });

    it('should return 400 if the token is not valid', async () => {
      const token = 'some.gibberish';

      const res = await request(server)
        .get('/api/users/current')
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid token.');
    });

    it('should return 401 if the token is not provided', async () => {
      const res = await request(server).get('/api/users/current');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('POST /users', () => {
    it('should register a user if the body is valid', async () => {
      const user = {
        name: 'User Name',
        email: 'email@domain.com',
        password: '123456',
        repeatPassword: '123456'
      };

      const res = await request(server)
        .post('/api/users')
        .send(user);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('User Name');
      expect(res.body.email).toBe('email@domain.com');
      expect(res.header['x-auth-token']).toBeDefined();
    });

    it('should return 400 if the body is not valid', async () => {
      const user = {
        name: 'User Name',
        email: 'email@domain.com',
        password: '123456'
      };

      const res = await request(server)
        .post('/api/users')
        .send(user);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 if the user is already registered', async () => {
      const user = {
        name: 'User Name',
        email: 'email@domain.com',
        password: '123456',
        repeatPassword: '123456'
      };

      await User.create(user);

      const res = await request(server)
        .post('/api/users')
        .send(user);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already registered.');
    });
  });
});
