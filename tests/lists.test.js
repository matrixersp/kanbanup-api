const request = require('supertest');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');

let server;

describe('/api/lists', () => {
  const boardId = new ObjectId();
  const listId = new ObjectId();

  beforeEach(async () => {
    server = require('../server');
    await Board.create({
      _id: boardId,
      title: 'Board 1',
      lists: [{ _id: listId, title: 'First list' }]
    });
  });
  afterEach(async () => {
    server.close();
    await Board.deleteMany({});
  });

  describe('POST /', () => {
    it('should create a list if the body is valid', async () => {
      const res = await request(server)
        .post('/api/lists')
        .send({ title: 'List 1', boardId });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('List 1');
    });

    it('should return 400 if the title field is not specified', async () => {
      const res = await request(server)
        .post('/api/lists')
        .send({ boardId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .post('/api/lists')
        .send({ title: 'List 1', boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the passed board ID was not found', async () => {
      const res = await request(server)
        .post(`/api/lists`)
        .send({ title: 'List 1', boardId: new ObjectId() });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });
  });

  describe('PUT /:id', () => {
    it('should patch the list if the list ID and the body are valid', async () => {
      const res = await request(server)
        .put(`/api/lists/${listId}`)
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Updated List');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .put('/api/lists/1')
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .put(`/api/lists/${listId}`)
        .send({ title: 'Updated List', boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the list with the given ID was not found', async () => {
      const res = await request(server)
        .put(`/api/lists/${new ObjectId()}`)
        .send({ title: 'Updated List', boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });

    it.todo('should return 404 if the board was not found');

    it('should return 400 if the title field is not specified', async () => {
      const res = await request(server)
        .put(`/api/lists/${listId}`)
        .send({ boardId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a list if the passed ID is valid', async () => {
      const res = await request(server)
        .delete(`/api/lists/${listId}`)
        .send({ boardId });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The list was successfully deleted.');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .delete('/api/lists/1')
        .send({ boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .delete(`/api/lists/${listId}`)
        .send({ title: 'Updated List', boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the list with the given ID was not found', async () => {
      const res = await request(server)
        .delete(`/api/lists/${new ObjectId()}`)
        .send({ boardId });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });
  });
});
