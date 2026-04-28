const express = require("express")
const axios = require("axios")

const app = express();
app.use(express.json())

const swaggerUi = require('swagger-ui-express')
const fs = require('node:fs')
const YAML = require('js-yaml')

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3000';
const GAME_MANAGER_URL = process.env.GAME_MANAGER_URL || 'http://localhost:5000';
const GAMEY_SERVICE_URL = process.env.GAMEY_SERVICE_URL || 'http://localhost:4000';

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

let proxyRequest = async(targetUrl, req, res) => {
    try{
        // Mapeo de servicios permitidos
        const SERVICE_MAP = {
            [USERS_SERVICE_URL]: 'users',
            [GAME_MANAGER_URL]: 'game-manager',
            [GAMEY_SERVICE_URL]: 'gamey'
        };
        
        const serviceName = SERVICE_MAP[targetUrl];
        
        if (!serviceName) {
            return res.status(403).json({ error: 'Forbidden service' });
        }

        const requestPath = req.path;
        
        // Lista blanca de patrones de ruta permitidos por servicio
        const ALLOWED_PATTERNS = {
            'users': [
                /^\/register$/,
                /^\/login$/,
                /^\/stats\/update$/,
                /^\/stats\/[\w-]+$/,
                /^\/history\/[a-f0-9]{24}$/,
                /^\/history\/add$/
            ],
            'game-manager': [
                /^\/create\/\w+$/,
                /^\/state\/[a-f0-9]{24}$/,
                /^\/game\/[a-f0-9]{24}\/move\/(player|bot)$/,
                /^\/game\/[a-f0-9]{24}\/resign$/,
                /^\/list$/,
                /^\/health$/,
                /^\/api\/gamey\/play$/
            ],
            'gamey': [/^\/v1\/ybot\/.+$/]
        };
        
        const patterns = ALLOWED_PATTERNS[serviceName] || [];
        const isPathAllowed = patterns.some(pattern => pattern.test(requestPath));
        
        if (!isPathAllowed) {
            return res.status(403).json({ error: 'Path not allowed for this service' });
        }

        // Construcción segura de URL
        const baseUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
        const fullUrl = `${baseUrl}${requestPath}`;

        const response = await axios({
            method: req.method,
            url: fullUrl,
            data: req.body,
            headers: {
                "Content-Type": "application/json",
                ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] })
            },
            params: req.query,
            maxRedirects: 0,
        });
        
        res.status(response.status).json(response.data);
    } catch(error){
        const status = error.response?.status || 500;
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
    if (!req.query.position) {
        return res.status(400).json({ error: '`position` query parameter is required' });
    }

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
});


app.get('/status', (req,res) => {
    res.json({status: 'ok', service: 'gatewayservice'})
})

if (require.main?.filename === __filename) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Gateway service running on: ${PORT}`);
  });
}

module.exports = app;