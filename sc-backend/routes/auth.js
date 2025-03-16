import { Router } from 'express';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';
import upload from '../multerConfig.js';

dotenv.config();

const router = Router();

// Middleware to authenticate and authorize admins
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.post('/register', authMiddleware, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  const {
    name,
    username: rawUsername,
    password,
    email,
    role,
    course,
    module,
    startDate,
    endDate,
    phone,
    address,
  } = req.body;

  const username = rawUsername.trim();

  const image = req.file;

  console.log('Registration request:', req.body, req.file);

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await hash(password, 10);

    let imageUrl = null;
    if (image) {
      imageUrl = `${process.env.BASE_URL}/uploads/${image.filename}`;
      console.log('Generated imageUrl:', imageUrl);
    }

    await db.query(
      'INSERT INTO users (name, username, password, email, role, course, module, startDate, endDate, phone, address, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, username, hashedPassword, email, role, course || null, module || null, startDate || null, endDate || null, phone || null, address || null, imageUrl || null]
    );

    console.log('User registered:', { username, role, course, module, imageUrl });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'Invalid file type') {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and PDF are allowed.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username: rawUsername, password } = req.body;

  const username = rawUsername.trim();

  console.log('Login attempt:', { username });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('User found:', user);

    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, course: user.course, module: user.module, imageUrl: user.imageUrl });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/update-image', authMiddleware, upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  const image = req.file;

  if (!image) {
    return res.status(400).json({ message: 'No image provided' });
  }

  try {
    const imageUrl = `${process.env.BASE_URL}/uploads/${image.filename}`;
    console.log('Updating image for user:', userId, 'new imageUrl:', imageUrl);

    await db.query('UPDATE users SET imageUrl = ? WHERE id = ?', [imageUrl, userId]);

    res.json({ message: 'Image updated successfully', imageUrl });
  } catch (error) {
    console.error('Image update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/student/dashboard', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    res.json({
      student: {
        id: user.id, // Add ID
        role: user.role, // Add role
        name: user.name,
        course: user.course,
        startDate: user.startDate,
        endDate: user.endDate,
        email: user.email,
        phone: user.phone,
        address: user.address,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;