const express = require("express")
const axios = require("axios")

const app = express();
app.use(express.json())

const swaggerUi = require('swagger-ui-express')
const fs = require('node:fs')
const YAML = require('js-yaml')

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
            headers: {"Content-Type": "application/json"},
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
app.use('/api/game-manager', (req,res) => proxyRequest(GAME_MANAGER_URL, req, res))
app.use('/api/gamey', (req,res) => proxyRequest(GAMEY_SERVICE_URL, req, res))


app.get('/health', (req,res) => {
    res.json({status: 'ok', service: 'gatewayservice'})
})

if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Gateway service running on: ${PORT}`);
  });
}

module.exports = app;