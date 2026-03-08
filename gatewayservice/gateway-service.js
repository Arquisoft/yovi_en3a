const express = require("express")
const axios = require("axios")

const app = express();
app.use(express.json())

const swaggerUi = require('swagger-ui-express')
const fs = require('node:fs')
const YAML = require('js-yaml')

//Authentication for users in games
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '8889c0d6ea431e5baa4872574239fad4fef44c8a98f8771c182ad8626233dcac6af7f9da4843432c2a268d3e60696267f47a57343a51f627323835ea637b4972';

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

//It enters from /api/xyz and it redirects to xyz
app.use('/api/users', (req,res) => proxyRequest(USERS_SERVICE_URL, req, res))
app.use('/api/game-manager', authMiddleware, (req, res) => proxyRequest(GAME_MANAGER_URL, req, res));
//app.use('/api/gamey', (req,res) => proxyRequest(GAMEY_SERVICE_URL, req, res))

// Used for playing against the desired bot of our game
app.post('/api/gamey/play', async (req, res) => {
    const { botId = 'random_bot', ...yen } = req.body;

    if (!yen.layout || !yen.size) {
        return res.status(400).json({ error: 'yen (layout, size) is required' });
    }

    try {
        const response = await axios.post(
            `${GAMEY_SERVICE_URL}/v1/ybot/choose/${botId}`,
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