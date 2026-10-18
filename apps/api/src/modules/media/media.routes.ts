import { Router } from 'express';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../shared/middleware/authenticate';
import { mediaService, type UploadedFile } from './media.service';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  },
});

// Upload a single file (avatar, cover, etc.)
mediaRouter.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw AppError.badRequest('No file uploaded');
      }
      const folder = (req.query['folder'] as string) || 'general';
      const uploadedFile: UploadedFile = {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer,
        size: req.file.size,
      };

      const result = await mediaService.processAndStore(uploadedFile, req.user!.id, folder);
      respond(res, 201, result, 'File uploaded successfully');
    } catch (err) {
      next(err);
    }
  },
);

// Upload multiple files
mediaRouter.post(
  '/upload-multiple',
  requireAuth,
  upload.array('files', 10),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw AppError.badRequest('No files uploaded');
      }
      const folder = (req.query['folder'] as string) || 'outfits';
      const uploadedFiles: UploadedFile[] = files.map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        buffer: f.buffer,
        size: f.size,
      }));

      const results = await Promise.all(
        uploadedFiles.map((f) => mediaService.processAndStore(f, req.user!.id, folder)),
      );
      respond(res, 201, results, 'Files uploaded successfully');
    } catch (err) {
      next(err);
    }
  },
);
