import { Router } from 'express';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';

const r = Router();

r.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    const result = await uploadBuffer(req.file.buffer, {
      folder: `general/${req.user!.id}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    return ok(res, result);
  }),
);

export default r;
