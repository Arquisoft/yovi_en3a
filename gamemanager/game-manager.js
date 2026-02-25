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

// Aux methods:

const emptyLayout = (size) => {
    const rows = [];
    for (let i = 1; i <= size; i++) {
        rows.push('.'.repeat(i));
    }
    return rows.join('/');
}

const getBotMove = async (botId, yen) => {
    try {
        const response = await axios.post(
            `${GAMEY_SERVICE_URL}/v1/ybot/choose/${botId}`,
            yen,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.coords;
    } catch (err) {
        console.warn('Gamey not available');
        return null;
    }
}


const applyMove = (layout, size, coords, playerSymbol) => {
    const rows = layout.split('/');
    const row = rows[coords.x];

    if (!row || coords.y >= row.length) {
        return null;
    } 
    if (row[coords.y] !== '.') {
        return null;
    } 

    rows[coords.x] = row.substring(0, coords.y) + playerSymbol + row.substring(coords.y + 1);
    return rows.join('/');
}

// End aux methods

// New game
app.post('/game', async (req, res) => {
    const { userId, botId = 'random_bot', boardSize = 5 } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId' });
        }

        const initialLayout = emptyLayout(boardSize);
        const yen = {
            size: boardSize,
            turn: 0,
            players: ['B', 'R'],
            layout: initialLayout,
        };

        const newGame = new Game({
            userId,
            botId,
            boardSize,
            yen,
            status: 'ongoing',
        });

        await newGame.save();

        res.status(201).json({
            message: 'Game created sucessfully',
            gameId: newGame._id,
            yen: newGame.yen,
            status: newGame.status,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get game state
app.get('/game/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json({
            gameId: game._id,
            userId: game.userId,
            botId: game.botId,
            yen: game.yen,
            status: game.status,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Player makes a move
app.post('/game/:id/move', async (req, res) => {
    const { coords } = req.body;

    try {
        if (!coords || coords.x === undefined || coords.y === undefined) {
            return res.status(400).json({ error: 'Coords (x,y) are mandatory' });
        }

        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.status !== 'ongoing') {
            return res.status(400).json({ error: `Game is already ${game.status}` });
        }

        // Player turn = 0
        // Bot turn = 1
        if (game.yen.turn !== 0) {
            return res.status(400).json({ error: 'Not your turn' });
        }

        const playerSymbol = game.yen.players[0];
        const newLayout = applyMove(game.yen.layout, game.yen.size, coords, playerSymbol);
        if (!newLayout) {
            return res.status(400).json({ error: 'Invalid move' });
        }

        game.yen.layout = newLayout;
        game.yen.turn = 1;
        game.updatedAt = new Date();
        game.markModified('yen');
        await game.save();

        const botCoords = await getBotMove(game.botId, game.yen);

        if (botCoords) {
            const botSymbol = game.yen.players[1];
            const layoutAfterBot = applyMove(game.yen.layout, game.yen.size, botCoords, botSymbol);
            if (layoutAfterBot) {
                game.yen.layout = layoutAfterBot;
                game.yen.turn = 0;
                game.updatedAt = new Date();
                game.markModified('yen');
                await game.save();
            }
        } else {
            game.yen.turn = 0;
            game.markModified('yen');
            await game.save();
        }

        res.json({
            message: 'Move applied',
            gameId: game._id,
            yen: game.yen,
            status: game.status,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Player surrenders
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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gamemanager' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Game Manager listening at http://localhost:${port}`);
    });
}

module.exports = app;