import path from 'node:path';
import fs from 'node:fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { nanoid } from 'nanoid';

if (env.STORAGE_DRIVER === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export async function uploadBuffer(
  buffer: Buffer,
  opts: { folder: string; filename?: string; mime: string },
): Promise<UploadResult> {
  if (env.STORAGE_DRIVER === 'cloudinary' && env.CLOUDINARY_API_KEY) {
    return new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `vibe/${opts.folder}`, resource_type: 'auto' },
        (err, result) => {
          if (err || !result) return reject(err || new Error('Upload failed'));
          resolve({
            url: result.secure_url,
            thumbnail: result.eager?.[0]?.secure_url,
            width: result.width,
            height: result.height,
            duration: result.duration ? Math.round(result.duration) : undefined,
          });
        },
      );
      stream.end(buffer);
    });
  }

  // local fallback (dev only)
  const baseDir = path.resolve(process.cwd(), 'uploads', opts.folder);
  await fs.mkdir(baseDir, { recursive: true });
  const ext = opts.filename ? path.extname(opts.filename) : '';
  const name = `${Date.now()}-${nanoid(8)}${ext}`;
  const filePath = path.join(baseDir, name);
  await fs.writeFile(filePath, buffer);
  const url = `${env.API_URL}/uploads/${opts.folder}/${name}`;
  return { url };
}
