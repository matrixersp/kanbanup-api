const request = require('supertest');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');
const { Card } = require('../models/card');

let server;

describe('/api/cards', () => {
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
    await Board.deleteMany();
    await Card.deleteMany();
  });

  describe('GET /', () => {
    it('should get all cards for a specified board', async () => {
      await Card.insertMany([
        { boardId, listId, title: 'Card 1' },
        { boardId, listId, title: 'Card 2' }
      ]);
      const res = await request(server)
        .get('/api/cards/')
        .send({ boardId });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.some(c => c.title === 'Card 1')).toBeTruthy();
      expect(res.body.some(c => c.title === 'Card 2')).toBeTruthy();
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .get('/api/cards')
        .send({ boardId: '1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });
  });

  describe('GET /:id', () => {
    it('should return a card if the passed ID is valid', async () => {
      const card = new Card({ boardId, listId, title: 'Card 1' });
      await card.save();

      const res = await request(server).get(`/api/cards/${card._id}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Card 1');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server).get('/api/cards/1');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the card with the given ID was not found', async () => {
      const res = await request(server).get(`/api/cards/${new ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });
  });

  describe('POST /', () => {
    it('should create a card if body is valid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId, listId, title: 'Card 1' });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Card 1');
    });

    it('should return 404 if the passed board ID was not found', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId: new ObjectId(), listId, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });

    it('should return 404 if the passed list ID was not found', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId, listId: new ObjectId(), title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId: '1', listId, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the passed list ID is invalid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId, listId: '1', title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('List ID is not valid.');
    });

    it('should return 400 if the title is not specified', async () => {
      const res = await request(server)
        .post('/api/cards')
        .send({ boardId, listId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PUT /:id', () => {
    it('should patch the card if the ID and the body are valid', async () => {
      const card = new Card({ boardId, listId, title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .put(`/api/cards/${card._id}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Updated Title');
    });

    it('should return 404 if the card ID is invalid', async () => {
      const res = await request(server)
        .put('/api/cards/1')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the card was not found', async () => {
      const res = await request(server)
        .put(`/api/cards/${new ObjectId()}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });

    it('should return 400 if the title is not specified', async () => {
      const card = new Card({ boardId, listId, title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .put(`/api/cards/${card._id}`)
        .send({ boardId, listId });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a card if the passed ID is valid', async () => {
      const card = new Card({ boardId, listId, title: 'Card 1' });
      await card.save();

      const res = await request(server).delete(`/api/cards/${card._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The card was successfully deleted.');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server).delete('/api/cards/1');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });
    it('should return 404 if the card with the given ID was not found', async () => {
      const res = await request(server).delete(`/api/cards/${new ObjectId()}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });
  });
});
