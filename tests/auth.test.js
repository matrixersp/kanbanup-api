const request = require('supertest');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');

let server;

describe('/api/auth', () => {
  const password = '123456';
  const hash = bcrypt.hashSync(password, 10);

  beforeEach(async () => {
    server = require('../server');
    const testUser = new User({
      name: 'User Name',
      email: 'email@domain.com',
      password: hash
    });
    await testUser.save();
  });

  afterEach(async () => {
    server.close();
    await User.deleteMany();
  });

  describe('POST /auth', () => {
    it('should authenticate user if the body is valid', async () => {
      const user = {
        email: 'email@domain.com',
        password: '123456'
      };

      const res = await request(server)
        .post('/api/auth')
        .send(user);

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('User Name');
      expect(res.body.email).toBe('email@domain.com');
      expect(res.header['x-auth-token']).toBeDefined();
    });

    it('should return 400 the body is invalid', async () => {
      const user = {
        email: 'email@domain.com',
        password: '234567'
      };

      const res = await request(server)
        .post('/api/auth')
        .send(user);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid Email or password.');
    });
  });

  it('should return 400 if a field is missing', async () => {
    const user = {
      email: 'email@domain.com'
    };

    const res = await request(server)
      .post('/api/auth')
      .send(user);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
