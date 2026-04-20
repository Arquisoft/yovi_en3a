const express = require("express")
const axios = require("axios")

const app = express();
app.use(express.json())

const swaggerUi = require('swagger-ui-express')
const fs = require('node:fs')
const YAML = require('js-yaml')

//Authentication for users in games
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.headers['x-user-id'] = decoded.userId; // ✅ inyecta el userId para el GameManager
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'))
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
} catch (e) {
  console.log(e)
}

// Running in docker || Running in localhost
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3000";
const GAME_MANAGER_URL= process.env.GAME_MANAGER_URL || "http://localhost:5000";
const GAMEY_SERVICE_URL = process.env.GAMEY_SERVICE_URL || "http://localhost:4000";

// Receives and sends the petition to the corresponding client
let proxyRequest = async(targetUrl, req, res) => {
    try{
        const response = await axios({
            method: req.method, //REST petition
            url: `${targetUrl}${req.path}`, //http://service:port + /service/personal/endpoint
            data: req.body,
            headers: {"Content-Type": "application/json",
                      ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] })}, //We send the userId to the GameManager if it exists, so it can identify if the game belongs to the user
            params: req.query,
        });
        res.status(response.status).json(response.data);
    } catch(error){
        const status = error.response?.status || 500; //if there is no error sent by error, the server has suffer inner error (500)
        const data = error.response?.data || {error: "Internal gateway error"};
        res.status(status).json(data);
    }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
//It enters from /api/xyz and it redirects to xyz
app.use('/api/users', (req, res, next) => {
    if (req.path.startsWith('/stats')) return authMiddleware(req, res, next);
    next();
}, (req, res) => proxyRequest(USERS_SERVICE_URL, req, res))

app.use('/api/game-manager', authMiddleware, (req, res) => proxyRequest(GAME_MANAGER_URL, req, res));
//app.use('/api/gamey', (req,res) => proxyRequest(GAMEY_SERVICE_URL, req, res))

// Used for playing against the desired bot of our game
app.get('/play', (req, res) => {
    try {
        axios({
            method: 'GET',
            url: `${GAME_MANAGER_URL}/api/gamey/play`,
            params: req.query,
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => res.status(response.status).json(response.data))
        .catch(error => {
            const status = error.response?.status || 500;
            const data = error.response?.data || { error: 'Internal gateway error' };
            res.status(status).json(data);
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal gateway error' });
    }
});


app.get('/status', (req,res) => {
    res.json({status: 'ok', service: 'gatewayservice'})
})

if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Gateway service running on: ${PORT}`);
  });
}

module.exports = app;