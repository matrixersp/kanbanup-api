const request = require('supertest');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');

let server;

describe('/api/boards', () => {
  beforeEach(() => {
    server = require('../server');
  });

  afterEach(async () => {
    server.close();
    await Board.deleteMany({});
  });

  describe('GET /', () => {
    Board.insertMany([{ name: 'Board 1' }, { name: 'Board 2' }]);

    it('should return all boards', async () => {
      const res = await request(server).get('/api/boards');
      expect(res.status).toBe(200);
      expect(res.body[0].name).toEqual('Board 1');
      expect(res.body[1].name).toEqual('Board 2');
    });
  });

  describe('GET /:id', () => {
    it('should return a board if valid ID is passed', async () => {
      const board = new Board({ name: 'Board 1' });
      await board.save();

      const res = await request(server).get(`/api/boards/${board._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Board 1');
    });

    it('should return 404 if invalid ID is passed', async () => {
      const res = await request(server).get('/api/boards/1');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server).get(`/api/boards/${new ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });
  });

  describe('POST /', () => {
    it('should post a board if the request body is valid', async () => {
      const res = await request(server)
        .post('/api/boards')
        .send({ name: 'Board 1' });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('Board 1');
    });

    it('should return 400 if the name field is not specified', async () => {
      const res = await request(server)
        .post('/api/boards')
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).not.toBeNull();
    });
  });

  describe('PUT /:id', () => {
    it('should patch the board if the ID and the name field are valid', async () => {
      const board = new Board({ name: 'Board 1' });
      await board.save();

      const res = await request(server)
        .put(`/api/boards/${board._id}`)
        .send({ name: 'Updated Board' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Board');
    });

    it('should return 404 if invalid ID is passed', async () => {
      const res = await request(server)
        .put('/api/boards/1')
        .send({ name: 'Updated Board' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server)
        .put(`/api/boards/${new ObjectId()}`)
        .send({ name: 'Updated Board' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });

    it('should return 400 if the name field is not specified', async () => {
      const board = new Board({ name: 'Baord 1' });
      await board.save();

      const res = await request(server).put(`/api/boards/${board._id}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).not.toBeUndefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a board if valid ID is passed', async () => {
      const board = new Board({ name: 'Board 1' });
      await board.save();

      const res = await request(server).delete(`/api/boards/${board._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The board was successfully deleted.');
    });

    it('should return 404 if invalid ID is passed', async () => {
      const res = await request(server).delete('/api/boards/1');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the board with the given ID was not found', async () => {
      const res = await request(server).delete(`/api/boards/${ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });
  });
});
