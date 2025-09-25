"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCPStorage = void 0;
const storage_1 = require("@google-cloud/storage");
class GCPStorage {
    constructor() {
        this.storage = new storage_1.Storage({
            projectId: process.env.GCP_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }
    async uploadFile(bucketName, fileName, fileBuffer, contentType) {
        const bucket = this.storage.bucket(bucketName);
        const file = bucket.file(fileName);
        const metadata = contentType ? { contentType } : {};
        await file.save(fileBuffer, {
            metadata,
            resumable: false,
        });
        return `gs://${bucketName}/${fileName}`;
    }
    async downloadFile(bucketName, fileName) {
        const bucket = this.storage.bucket(bucketName);
        const file = bucket.file(fileName);
        const [buffer] = await file.download();
        return buffer;
    }
    async deleteFile(bucketName, fileName) {
        const bucket = this.storage.bucket(bucketName);
        const file = bucket.file(fileName);
        await file.delete();
    }
}
exports.GCPStorage = GCPStorage;
