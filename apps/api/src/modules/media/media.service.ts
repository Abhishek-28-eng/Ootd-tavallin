// ============================================================
// Media Service — local storage + S3/R2 support
// ============================================================
import { createHash } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';
import { OutfitMedia } from '../../database/models';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ProcessedMedia {
  objectKey: string;
  publicUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = (env.STORAGE_UPLOAD_SIZE_LIMIT_MB ?? 10) * 1024 * 1024;

export class MediaService {
  private readonly localUploadDir = join(process.cwd(), 'uploads');

  // ─── Validate file ────────────────────────────────────────────
  validateFile(file: UploadedFile): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw AppError.badRequest(
        `File type ${file.mimetype} is not supported. Use JPEG, PNG, or WebP.`,
        'VALIDATION_ERROR',
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw AppError.badRequest(
        `File too large. Maximum size is ${env.STORAGE_UPLOAD_SIZE_LIMIT_MB}MB.`,
        'VALIDATION_ERROR',
      );
    }
  }

  // ─── Process and store image ──────────────────────────────────
  async processAndStore(
    file: UploadedFile,
    userId: string,
    folder = 'outfits',
  ): Promise<ProcessedMedia> {
    this.validateFile(file);

    // Process with sharp: convert to WebP for consistency
    let processed: Buffer;
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailBuffer: Buffer | null = null;

    try {
      const sharpInstance = sharp(file.buffer);
      const meta = await sharpInstance.metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;

      // Main image — resize to max 2048px wide, convert to webp
      processed = await sharpInstance
        .resize({ width: 2048, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      // Thumbnail — 400px wide
      thumbnailBuffer = await sharp(file.buffer)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();
    } catch (err) {
      logger.error({ err }, 'Image processing failed');
      throw AppError.internal('Failed to process image');
    }

    const objectKey = `${folder}/${userId}/${randomUUID()}.webp`;
    const thumbKey = `${folder}/${userId}/thumb_${objectKey.split('/').pop()}`;

    let publicUrl: string;
    let thumbnailUrl: string | null = null;

    if (env.STORAGE_PROVIDER === 's3') {
      [publicUrl, thumbnailUrl] = await this.uploadToS3(processed, thumbnailBuffer, objectKey, thumbKey);
    } else {
      [publicUrl, thumbnailUrl] = await this.saveLocally(processed, thumbnailBuffer, objectKey, thumbKey);
    }

    return {
      objectKey,
      publicUrl,
      thumbnailUrl,
      mimeType: 'image/webp',
      fileSize: processed.length,
      width,
      height,
    };
  }

  // ─── Save to local filesystem (development) ────────────────────
  private async saveLocally(
    main: Buffer,
    thumb: Buffer | null,
    objectKey: string,
    thumbKey: string,
  ): Promise<[string, string | null]> {
    const mainPath = join(this.localUploadDir, objectKey);
    const thumbPath = join(this.localUploadDir, thumbKey);

    await mkdir(join(this.localUploadDir, objectKey.split('/').slice(0, -1).join('/')), {
      recursive: true,
    });

    await writeFile(mainPath, main);

    let thumbUrl: string | null = null;
    if (thumb) {
      await writeFile(thumbPath, thumb);
      thumbUrl = `${env.STORAGE_PUBLIC_BASE_URL}/${thumbKey}`;
    }

    return [`${env.STORAGE_PUBLIC_BASE_URL}/${objectKey}`, thumbUrl];
  }

  // ─── Upload to S3 / R2 ────────────────────────────────────────
  private async uploadToS3(
    main: Buffer,
    thumb: Buffer | null,
    objectKey: string,
    thumbKey: string,
  ): Promise<[string, string | null]> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Config: {
      region: string;
      endpoint?: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    } = {
      region: env.STORAGE_REGION,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
    };
    if (env.STORAGE_ENDPOINT) {
      s3Config.endpoint = env.STORAGE_ENDPOINT;
    }

    const client = new S3Client(s3Config);

    await client.send(
      new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: objectKey,
        Body: main,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }),
    );

    let thumbUrl: string | null = null;
    if (thumb) {
      await client.send(
        new PutObjectCommand({
          Bucket: env.STORAGE_BUCKET,
          Key: thumbKey,
          Body: thumb,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000',
        }),
      );
      thumbUrl = `${env.STORAGE_PUBLIC_BASE_URL}/${thumbKey}`;
    }

    return [`${env.STORAGE_PUBLIC_BASE_URL}/${objectKey}`, thumbUrl];
  }

  // ─── Delete media ─────────────────────────────────────────────
  async deleteMedia(objectKey: string): Promise<void> {
    if (env.STORAGE_PROVIDER === 'local') {
      const filePath = join(this.localUploadDir, objectKey);
      try {
        await unlink(filePath);
      } catch {
        // File may not exist
      }
    } else {
      try {
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Config: {
          region: string;
          endpoint?: string;
          credentials: {
            accessKeyId: string;
            secretAccessKey: string;
          };
        } = {
          region: env.STORAGE_REGION,
          credentials: {
            accessKeyId: env.STORAGE_ACCESS_KEY_ID,
            secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
          },
        };
        if (env.STORAGE_ENDPOINT) {
          s3Config.endpoint = env.STORAGE_ENDPOINT;
        }

        const client = new S3Client(s3Config);
        await client.send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: objectKey }));
      } catch (err) {
        logger.error({ err, objectKey }, 'Failed to delete S3 object');
      }
    }
  }
}

export const mediaService = new MediaService();
