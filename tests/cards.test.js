const request = require('supertest');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;
const { Board } = require('../models/board');
const { Card } = require('../models/card');
const { User } = require('../models/user');

let server;

describe('/api/cards', () => {
  const boardId = new ObjectId();
  const listId1 = new ObjectId();
  const listId2 = new ObjectId();

  const password = '123456';
  const hash = bcrypt.hashSync(password, 10);

  const user = new User({
    name: 'User Name',
    email: 'email@domain.com',
    password: hash
  });

  const board = new Board({
    _id: boardId,
    title: 'Board 1',
    lists: [
      { _id: listId1, title: 'First list' },
      { _id: listId2, title: 'Second List' }
    ],
    creator: user._id,
    participants: user._id
  });

  let token;

  beforeAll(async () => {
    server = require('../server');
    await user.save();
    token = user.genAuthToken();
    await board.save();
  });

  afterAll(async () => {
    await Card.deleteMany();
    await Board.deleteMany();
    await User.deleteMany();
    server.close();
  });

  describe('GET /:id', () => {
    it('should return a card if the passed ID is valid', async () => {
      const card = new Card({ title: 'Card 1', boardId, listId: listId1 });
      await Board.findOneAndUpdate(
        { _id: boardId, lists: listId1 },
        { $push: { 'lists.$.cards': card } }
      );
      await card.save();

      const res = await request(server)
        .get(`/api/cards/${card._id}`)
        .set('authorization', `Bearer ${token}`)
        .query({ boardId: boardId.toString() });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Card 1');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .get('/api/cards/1')
        .set('authorization', `Bearer ${token}`)
        .query({ boardId: boardId.toString() });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the card with the given ID was not found', async () => {
      const res = await request(server)
        .get(`/api/cards/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .query({ boardId: boardId.toString() });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });
  });

  describe('POST /', () => {
    it('should create a card if body is valid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1, title: 'Card 1' });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Card 1');
    });

    it('should return 404 if the passed board ID was not found', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId: new ObjectId(), listId: listId1, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The board with the given ID was not found.');
    });

    it('should return 404 if the passed list ID was not found', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: new ObjectId(), title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The list with the given ID was not found.');
    });

    it('should return 404 if the passed board ID is invalid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId: '1', listId: listId1, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is not valid.');
    });

    it('should return 404 if the passed list ID is invalid', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: '1', title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('List ID is not valid.');
    });

    it('should return 404 if board ID is not passed', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ listId: listId1, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Board ID is required.');
    });

    it('should return 404 if list ID is not passed', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, title: 'Card 1' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('List ID is required.');
    });

    it('should return 400 if the title is not specified', async () => {
      const res = await request(server)
        .post('/api/cards')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('PATCH /:id', () => {
    it('should update the title if the ID and the body are valid', async () => {
      const card = new Card({ title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .patch(`/api/cards/${card._id}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body._id).toBeDefined();
      expect(res.body.title).toBe('Updated Title');
    });

    it('should move the card if the ID, source and destination are valid', async () => {
      const card = new Card({ title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .patch(`/api/cards/${card._id}`)
        .set('authorization', `Bearer ${token}`)
        .send({
          boardId,
          source: { listId: listId1, index: 0 },
          destination: { listId: listId2, index: 0 }
        });

      expect(res.status).toBe(204);

      const board = await Board.findById(boardId);

      const sourceList = board.lists.find(
        l => l._id.toString() === listId1.toString()
      );
      const destinationList = board.lists.find(
        l => l._id.toString() === listId2.toString()
      );

      expect(
        sourceList.cards.some(c => c._id.toString() === card._id.toString())
      ).toBeFalsy();
      expect(
        destinationList.cards.some(
          c => c._id.toString() === card._id.toString()
        )
      ).toBeTruthy();
    });

    it('should return 404 if the card ID is invalid', async () => {
      const res = await request(server)
        .patch('/api/cards/1')
        .set('authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the card was not found', async () => {
      const res = await request(server)
        .patch(`/api/cards/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, title: 'Updated Title' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });

    it('should return 400 if the title or source and destination are not specified', async () => {
      const card = new Card({ boardId, listId: listId1, title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .patch(`/api/cards/${card._id}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a card if the passed ID is valid', async () => {
      const card = new Card({ title: 'Card 1' });
      await card.save();

      const res = await request(server)
        .delete(`/api/cards/${card._id}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('The card was successfully deleted.');
    });

    it('should return 404 if the passed ID is invalid', async () => {
      const res = await request(server)
        .delete('/api/cards/1')
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('ID is not valid.');
    });

    it('should return 404 if the card with the given ID was not found', async () => {
      const res = await request(server)
        .delete(`/api/cards/${new ObjectId()}`)
        .set('authorization', `Bearer ${token}`)
        .send({ boardId, listId: listId1 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('The card with the given ID was not found.');
    });
  });
});
