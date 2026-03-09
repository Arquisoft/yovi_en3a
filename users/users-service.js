const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

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
const JWT_SECRET = process.env.JWT_SECRET

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

app.post('/register',
  [
    // Usarname is mandatory. Must have a length between 3 and 30 of alphanumeric characters.
    body('username')
      .trim() // Removes whitespaces.
      .notEmpty().withMessage('Username is mandatory')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .isAlphanumeric().withMessage('Username can only contain letters and numbers')
      .escape(), // Transforms html tags into safe equivalents (<script> -> &lt;script&gt;)

    // Email is mandatory.
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address') // Checks username@extension.
      .normalizeEmail(),  // Removes alias and transforms it to lowercase.

    // Password is mandatory. Must contain one letter and number and have a length between 8 and 64 characters.
    // Theres is no need to include escape() since it can it interfere with the encryption.
    body('password')
      .notEmpty().withMessage('Password is mandatory')
      .isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters')
      .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),

    // Age is optional. Must be between 0 and 120
    body('age')
      .optional({ nullable: true, checkFalsy: true }) // checkFalsy ignores: 0, "", null, undefined and false
      .isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),

    // Country is optional. Must have less than 60 characters and contain only letters, spaces or hyphens.
    body('country')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 40 }).withMessage('Country name is too long')
      .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-]+$/).withMessage('Country can only contain letters, spaces and hyphens')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, email, password, age, country } = req.body;

    try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(409).json({ error: 'Username or email are already in use' });
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
  }
);


app.post('/login',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is mandatory')
      .escape(),

    body('password')
      .notEmpty().withMessage('Password is mandatory'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    try {
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

      res.json({ message: 'Login successfully', token, userId: user._id });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app
