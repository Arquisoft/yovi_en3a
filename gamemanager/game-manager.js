const express = require('express');
const app = express();
const port = 5000;
const axios = require('axios');
const mongoose = require('mongoose');
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);
const Game = require('./models/game');

const { GameFactory } = require('./models/gameFactory');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
const GAMEY_SERVICE_URL = process.env.GAMEY_SERVICE_URL || 'http://localhost:4000';
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3000';

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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
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
    const rowIndex = size - 1 - coords.x;
    const row = rows[rowIndex];

    if (!row || coords.y >= row.length) return null;
    if (row[coords.y] !== '.') return null;

    rows[rowIndex] = row.substring(0, coords.y) + playerSymbol + row.substring(coords.y + 1);
    return rows.join('/');
}

const updateStats = async (userId, result) => {
    try {
        await axios.post(`${USERS_SERVICE_URL}/stats/update`,
            { userId, result },
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.warn('Could not update the stats:', error.message)
    }
}

const checkWin = async (yen) => {
    try {
        const response = await axios.post(
            `${GAMEY_SERVICE_URL}/v1/ybot/checkWin`,
            yen,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    } catch (err) {
        console.warn('checkWin failed:', err.message);
        return null;
    }
}

// End aux methods

// New game
app.post('/create/:gameName', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { botId = 'random_bot', boardSize = 5 } = req.body;
    const { gameName } = req.params;

    if (!GameFactory.isValid(gameName)) {
        return res.status(400).json({ error: `Unknown game type: ${gameName}` });
    }

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
            type: gameName,
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
app.get('/state/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];

    try {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
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

app.post('/game/:id/move/player', async (req, res) => {
    const { coords } = req.body;
    const userId = req.headers['x-user-id'];

    try {
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!coords || coords.x === undefined || coords.y === undefined) {
            return res.status(400).json({ error: 'Coords (x,y) are mandatory' });
        }

        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Game not found' });

        if (game.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });

        if (game.status !== 'ongoing') {
            return res.status(400).json({ error: `Game is already ${game.status}` });
        }

        const playerSymbol = game.yen.players[0];
        const newLayout = applyMove(game.yen.layout, game.yen.size, coords, playerSymbol);
        if (!newLayout) return res.status(400).json({ error: 'Invalid move' });

        game.yen.layout = newLayout;
        game.yen.turn = 1;
        game.updatedAt = new Date();
        game.markModified('yen');
        await game.save();

        const winCheck = await checkWin(game.yen);
        if (winCheck?.game_over) {
            game.status = winCheck.winner === 0 ? 'won' : 'lost';
            game.markModified('status');
            await game.save();
            await updateStats(userId, game.status);
            return res.json({ message: 'Game over', gameId: game._id, yen: game.yen, status: game.status });
        }

        res.json({ message: 'Move applied', gameId: game._id, yen: game.yen, status: game.status });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/game/:id/move/bot', async (req, res) => {
    const userId = req.headers['x-user-id'];

    try {
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Game not found' });

        if (game.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });

        if (game.status !== 'ongoing') {
            return res.status(400).json({ error: `Game is already ${game.status}` });
        }

        const botCoords = await getBotMove(game.botId, game.yen);
        if (!botCoords) return res.status(503).json({ error: 'Bot unavailable' });

        const botSymbol = game.yen.players[1];
        const newLayout = applyMove(game.yen.layout, game.yen.size, botCoords, botSymbol);
        if (!newLayout) return res.status(400).json({ error: 'Bot produced invalid move' });

        game.yen.layout = newLayout;
        game.yen.turn = 0;
        game.updatedAt = new Date();
        game.markModified('yen');
        await game.save();

        const winCheck = await checkWin(game.yen);
        if (winCheck?.game_over) {
            game.status = winCheck.winner === 0 ? 'won' : 'lost';
            game.markModified('status');
            await game.save();
            await updateStats(userId, game.status);
            return res.json({ message: 'Game over', gameId: game._id, yen: game.yen, status: game.status });
        }

        res.json({ message: 'Bot moved', gameId: game._id, yen: game.yen, status: game.status });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Player surrenders
app.post('/game/:id/resign', async (req, res) => {
    const userId = req.headers['x-user-id'];

    try {
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ error: 'Game not found' });

        if (game.userId.toString() !== userId) return res.status(403).json({ error: 'Forbidden' });

        if (game.status !== 'ongoing') {
            return res.status(400).json({ error: `The game is already ${game.status}` });
        }

        game.status = 'resigned';
        game.updatedAt = new Date();
        await game.save();
        await updateStats(userId, game.status);

        res.json({ message: 'Game resigned', gameId: game._id, status: game.status });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List user's games
app.get('/list', async (req, res) => {
    const userId = req.headers['x-user-id'];

    try {
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (typeof userId !== 'string' || userId.trim() === '') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const sanitizedUserId = userId.trim();

        if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const userObjectId = new mongoose.Types.ObjectId(sanitizedUserId);

        const games = await Game.find({ 
            userId: userObjectId 
        }).lean();

        res.json({
            userId: sanitizedUserId,
            total: games.length,
            games: games.map(game => ({
                gameId: game._id,
                gameName: game.gameName,
                botId: game.botId,
                boardSize: game.boardSize,
                status: game.status,
                createdAt: game.createdAt,
                updatedAt: game.updatedAt,
            }))
        });

    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gamemanager' });
});

app.get('/api/gamey/play', async (req, res) => {
    const { bot_id: botId = 'medium_bot', position } = req.query;

    // Mapeo hardcodeado - URLs completamente estáticas
    const BOT_ENDPOINTS = {
        'random_bot': `${GAMEY_SERVICE_URL}/v1/ybot/choose/random_bot`,
        'medium_bot': `${GAMEY_SERVICE_URL}/v1/ybot/choose/medium_bot`,
        'beginner_bot': `${GAMEY_SERVICE_URL}/v1/ybot/choose/beginner_bot`
    };
    
    // Validación estricta
    if (!Object.prototype.hasOwnProperty.call(BOT_ENDPOINTS, botId)) {
        return res.status(400).json({ 
            error: 'Invalid bot_id. Allowed values: random_bot, medium_bot, beginner_bot' 
        });
    }

    // Aquí targetUrl YA NO depende de user input, es una lookup de un objeto estático
    const targetUrl = BOT_ENDPOINTS[botId];

    if (!position) {
        return res.status(400).json({ error: '`position` query parameter is required' });
    }

    let yen;
    try {
        yen = typeof position === 'string' ? JSON.parse(position) : position;
    } catch {
        return res.status(400).json({ error: 'Invalid JSON in `position` parameter' });
    }

    if (!yen.layout || !yen.size) {
        return res.status(400).json({ error: '`position` must include at least `layout` and `size`' });
    }

    try {
        const response = await axios.post(
            targetUrl,
            yen,
            { headers: { 'Content-Type': 'application/json' } }
        );
        res.json({ coords: response.data.coords });
    } catch (error) {
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Gamey service error' };
        res.status(status).json(data);
    }
});

if (require.main && require.main.filename === __filename) {
    app.listen(port, () => {
        console.log(`Game Manager listening at http://localhost:${port}`);
    });
}

module.exports = app;