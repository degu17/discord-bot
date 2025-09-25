import { Storage } from '@google-cloud/storage';

export class GCPStorage {
  private storage: Storage;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  public async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType?: string
  ): Promise<string> {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const metadata = contentType ? { contentType } : {};

    await file.save(fileBuffer, {
      metadata,
      resumable: false,
    });

    return `gs://${bucketName}/${fileName}`;
  }

  public async downloadFile(
    bucketName: string,
    fileName: string
  ): Promise<Buffer> {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    const [buffer] = await file.download();
    return buffer;
  }

  public async deleteFile(bucketName: string, fileName: string): Promise<void> {
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.delete();
  }
}
