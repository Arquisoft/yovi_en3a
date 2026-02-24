const express = require('express');
const app = express();
const port = 5000;
const axios = require('axios');
const mongoose = require('mongoose');
const Game = require('./models/game');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
const GAMEY_SERVICE_URL = process.env.GAMEY_SERVICE_URL || 'http://localhost:4000';

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
    }
}

connectToMongoDB();

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.post('/game/:id/resign', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.status !== 'ongoing') {
            return res.status(400).json({ error: `The game is already ${game.status}` });
        }

        game.status = 'resigned';
        game.updatedAt = new Date();
        await game.save();

        res.json({ message: 'Game resigned', gameId: game._id, status: game.status });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Game Manager listening at http://localhost:${port}`);
    });
}

module.exports = app;