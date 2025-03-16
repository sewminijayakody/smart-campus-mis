import { Router } from 'express';
const router = Router();
import { single } from './multerConfig';  // Import multer configuration
import { query as _query } from '../db';  // Your database connection

// Route for file upload
router.post('/upload', single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // File metadata (e.g., filename, file path)
  const fileUrl = `/uploads/${req.file.filename}`;  // URL to access the file
  const title = req.body.title;  // Title of the file
  const description = req.body.description;  // Description of the file

  // Save metadata in the database
  const query = 'INSERT INTO uploads (title, description, fileName, fileUrl) VALUES (?, ?, ?, ?)';
  const values = [title, description, req.file.originalname, fileUrl];

  _query(query, values, (err, results) => {
    if (err) {
      console.error('Error saving file to database:', err);
      return res.status(500).json({ error: 'Error saving file to database' });
    }
    res.status(200).json({
      message: 'File uploaded and saved successfully',
      fileUrl: fileUrl,
    });
  });
});

export default router;
