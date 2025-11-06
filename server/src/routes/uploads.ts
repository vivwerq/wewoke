import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import path from 'path';
import fs from 'fs';

const router = Router();
// supabase is provided by ../lib/supabase and may be a stub when env vars are missing

// Simple in-memory rate limiter for uploads
const uploadAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_UPLOADS_PER_WINDOW = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(userId) || [];
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_UPLOADS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  recentAttempts.push(now);
  uploadAttempts.set(userId, recentAttempts);
  return true;
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '104857600') // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Upload video recording
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { userId, callId } = req.body;
    
    if (!userId || !callId) {
      // Clean up uploaded file safely
      try {
        // Ensure the file path is within the upload directory
        const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
        const filePath = path.resolve(req.file.path);
        if (filePath.startsWith(uploadDir)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      return res.status(400).json({ error: 'Missing userId or callId' });
    }
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      // Clean up uploaded file
      try {
        const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
        const filePath = path.resolve(req.file.path);
        if (filePath.startsWith(uploadDir)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
      return res.status(429).json({ error: 'Too many upload attempts. Please try again later.' });
    }
    
    // Store metadata in database (in a production app, you'd upload to cloud storage)
    const videoData = {
      user_id: userId,
      call_id: callId,
      file_name: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      video: {
        fileName: req.file.filename,
        size: req.file.size,
        callId
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get video metadata
router.get('/video/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    // In production, retrieve from database
    res.json({
      callId,
      message: 'Video metadata endpoint - implement storage logic'
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
