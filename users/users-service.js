const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

const mongoose = require("mongoose")
const User = require("./models/user")
const Stats = require("./models/stats");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/userdb"
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message)
  }
}

connectToMongoDB()

// No hay .env de momento, es por probar la encriptación
const JWT_SECRET = process.env.JWT_SECRET || '8889c0d6ea431e5baa4872574239fad4fef44c8a98f8771c182ad8626233dcac6af7f9da4843432c2a268d3e60696267f47a57343a51f627323835ea637b4972';

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.post('/createuser', async (req, res) => {
  const username = req.body && req.body.username;
  try {
    // Simulate a 1 second delay to mimic processing/network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const message = `Hello ${username}! welcome to the course!`;
    res.json({ message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, email, password, age, country } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are mandatory fields' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: 'That username or email are already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword, age, country });
    await newUser.save();

    const newStats = new Stats({ userId: newUser._id });
    await newStats.save();

    res.status(201).json({ message: 'User created', userId: newUser._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are mandatory fields' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Wrong credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Wrong credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successfully', token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app
