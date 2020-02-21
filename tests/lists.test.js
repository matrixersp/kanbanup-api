const request = require('supertest');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');
const { User } = require('../models/user');

let server;

describe('/api/lists', () => {
  const boardId = new ObjectId();
  const listId = new ObjectId();

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
    await Board.create({
      _id: boardId,
      title: 'Board 1',
      creator: user._id,
      participants: user._id,
      lists: [{ _id: listId, title: 'First list' }]
    });
  });

  afterAll(async () => {
    await Board.deleteMany({});
    await User.deleteMany({}); // TODO: remove users with boards
    server.close();
  });

  describe('POST /', () => {
    it('should create a list if the body is valid', async () => {
      const res = await request(server)
        .post('/api/lists')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'List 1', boardId });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('List 1');
    });

    it('should return 400 if the title field is not specified', async () => {
      const res = await request(server)
        .post('/api/lists')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .post('/api/lists')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'List 1', boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the passed board ID was not found', async () => {
      const res = await request(server)
        .post(`/api/lists`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'List 1', boardId: new ObjectId() });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });

    it('should return 404 if board ID is not passed', async () => {
      const res = await request(server)
        .post('/api/lists')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'List 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is required.');
    });
  });

  describe('PATCH /:id', () => {
    it('should update the list if the list ID and the body are valid', async () => {
      const res = await request(server)
        .patch(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Updated List');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .patch('/api/lists/1')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .patch(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated List', boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if board ID is not passed', async () => {
      const res = await request(server)
        .patch(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated List' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is required.');
    });

    it('should return 404 if the list with the given ID was not found', async () => {
      const res = await request(server)
        .patch(`/api/lists/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });

    it.todo('should return 404 if the board was not found');

    it('should return 400 if the title field is not specified', async () => {
      const res = await request(server)
        .patch(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a list if the passed ID is valid', async () => {
      const res = await request(server)
        .delete(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The list was successfully deleted.');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .delete('/api/lists/1')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .delete(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if board ID is not passed', async () => {
      const res = await request(server)
        .delete(`/api/lists/${listId}`)
        .set('authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is required.');
    });

    it('should return 404 if the list with the given ID was not found', async () => {
      const res = await request(server)
        .delete(`/api/lists/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });
  });
});
