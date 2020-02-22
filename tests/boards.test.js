const request = require('supertest');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');
const { User } = require('../models/user');

let server;

describe('/api/boards', () => {
  const password = '123456';
  const hash = bcrypt.hashSync(password, 10);

  const user = new User({
    name: 'User Name',
    email: 'email@domain.com',
    password: hash
  });

  let token;

  beforeAll(async () => {
    server = require('../server');
    await user.save();
    token = user.genAuthToken();
  });

  afterAll(async () => {
    await Board.deleteMany({});
    await User.deleteMany({}); // TODO: remove user's boards
    server.close();
  });

  describe('GET /', () => {
    Board.insertMany([
      { title: 'Board 1', owner: user._id, participants: user._id },
      { title: 'Board 2', owner: user._id, participants: user._id }
    ]);

    it('should return all boards', async () => {
      const res = await request(server)
        .get('/api/boards')
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.some(b => b.title === 'Board 1')).toBeTruthy();
      expect(res.body.some(b => b.title === 'Board 2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a board if valid ID is passed', async () => {
      const board = new Board({
        title: 'Board 1',
        owner: user._id,
        participants: user._id
      });
      await board.save();

      const res = await request(server)
        .get(`/api/boards/${board._id}`)
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Board 1');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .get('/api/boards/1')
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server)
        .get(`/api/boards/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });
  });

  describe('POST /', () => {
    it('should create a board if the body is valid', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Board 1' });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Board 1');
    });

    it('should return 400 if the title field is not specified', async () => {
      const res = await request(server)
        .post('/api/boards')
        .set('authorization', `Bearer ${token}`)
        .send({ title: '', owner: user._id });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PATCH /:id', () => {
    it('should update the board if the ID and the title field are valid', async () => {
      const board = new Board({
        title: 'Board 1',
        owner: user._id,
        participants: user._id
      });
      await board.save();

      const res = await request(server)
        .patch(`/api/boards/${board._id}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated Board' });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Updated Board');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .patch('/api/boards/1')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated Board' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server)
        .patch(`/api/boards/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated Board' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });

    it('should return 400 if the title field is not specified', async () => {
      const board = new Board({ title: 'Baord 1' });
      await board.save();

      const res = await request(server)
        .patch(`/api/boards/${board._id}`)
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a board if valid ID is passed', async () => {
      const board = new Board({ title: 'Board 1', owner: user._id });
      await board.save();

      const res = await request(server)
        .delete(`/api/boards/${board._id}`)
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The board was successfully deleted.');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .delete('/api/boards/1')
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server)
        .delete(`/api/boards/${ObjectId()}`)
        .set('authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });
  });
});
