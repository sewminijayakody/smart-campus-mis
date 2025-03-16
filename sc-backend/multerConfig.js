import multer, { diskStorage } from 'multer';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure the storage for uploaded files
const storage = diskStorage({
  destination: (req, file, cb) => {
    // Specify the folder where files will be stored
    const uploadPath = join(__dirname, 'uploads'); // Path to the 'uploads' folder
    cb(null, uploadPath); // Destination for uploaded files
  },
  filename: (req, file, cb) => {
    // Specify the filename, make it unique by appending the current timestamp
    cb(null, Date.now() + '_' + file.originalname); // Ensures unique filenames
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Optional: Set file size limit (50MB)
  fileFilter: (req, file, cb) => {
    // Accept only specific file types (you can customize this as needed)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/docx'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

export default upload;