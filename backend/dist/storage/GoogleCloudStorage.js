import { BaseStorage } from "./BaseStorage.js";
import { StorageProvider } from "./types.js";
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
dotenv.config();
export class GoogleCloudStorage extends BaseStorage {
    storage;
    bucketName;
    basePath;
    constructor() {
        super();
        const credentialsString = process.env.GOOGLE_CLOUD_APPLICATION_CREDENTIALS;
        if (!credentialsString || credentialsString.trim() === '') {
            throw new Error('GOOGLE_CLOUD_APPLICATION_CREDENTIALS is required');
        }
        this.storage = new Storage({
            credentials: JSON.parse(process.env.GOOGLE_CLOUD_APPLICATION_CREDENTIALS || '{}')
        });
        this.bucketName = process.env.BUCKET_NAME || '';
        this.basePath = process.env.STORAGE_BASE_PATH || '';
        if (!this.bucketName) {
            throw new Error('BUCKET_NAME is required');
        }
    }
    getStorageProviderName() {
        return StorageProvider.GoogleCloudStorage;
    }
    getFullPath(key) {
        return this.basePath ? `${this.basePath.replace(/\/$/, '')}/${key.replace(/^\//, '')}` : key;
    }
    async uploadFile(params) {
        const { srcFilePath, destinationKey } = params;
        const fullPath = this.getFullPath(destinationKey);
        await this.storage.bucket(this.bucketName).upload(srcFilePath, { destination: fullPath });
    }
    async uploadData(params) {
        const { destinationKey, data, contentType } = params;
        const fullPath = this.getFullPath(destinationKey);
        await this.storage
            .bucket(this.bucketName)
            .file(fullPath)
            .save(data, { metadata: { ...(contentType && { contentType }) } });
    }
    async downloadDocument(params) {
        const { srcKey, destinationFilePath } = params;
        const fullPath = this.getFullPath(srcKey);
        await this.storage.bucket(this.bucketName).file(fullPath).download({ destination: destinationFilePath });
    }
    async getData(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        const [data] = await this.storage.bucket(this.bucketName).file(fullPath).download();
        return data;
    }
    async generateDownloadSignedUrl(params) {
        const { key, fileName } = params;
        const fullPath = this.getFullPath(key);
        const [url] = await this.storage
            .bucket(this.bucketName)
            .file(fullPath)
            .getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            ...(fileName && { responseDisposition: `attachment; filename="${fileName}"` })
        });
        return url;
    }
    async deleteFile(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        await this.storage.bucket(this.bucketName).file(fullPath).delete();
    }
    async generateUploadSignedUrl(params) {
        const { key, contentType } = params;
        const fullPath = this.getFullPath(key); // Use full path
        const [url] = await this.storage // Use this.storage
            .bucket(this.bucketName) // Use this.bucketName
            .file(fullPath)
            .getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 60 * 60 * 1000, // 60 minutes
            contentType: contentType || 'application/octet-stream'
        });
        return { url };
    }
    async documentExists(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        const [doesExist] = await this.storage.bucket(this.bucketName).file(fullPath).exists();
        return doesExist;
    }
    async copyFile(params) {
        const { srcKey, destinationKey } = params;
        const storage = new Storage();
        const srcFile = storage.bucket(this.bucketName).file(this.getFullPath(srcKey));
        const destFile = storage.bucket(this.bucketName).file(this.getFullPath(destinationKey));
        await srcFile.copy(destFile);
    }
    async getFileMetadata(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        const [metadata] = await this.storage.bucket(this.bucketName).file(fullPath).getMetadata();
        const size = typeof metadata.size === 'string' ? parseFloat(metadata.size) : undefined;
        return { size };
    }
    async createReadStream(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        return await Promise.resolve(this.storage.bucket(this.bucketName).file(fullPath).createReadStream());
    }
    async createWriteStream(params) {
        const { key, contentType } = params;
        return await Promise.resolve(this.storage
            .bucket(this.bucketName)
            .file(this.getFullPath(key))
            .createWriteStream(contentType ? { contentType } : {}));
    }
    getRawFile(params) {
        const { key } = params;
        const fullPath = this.getFullPath(key);
        const file = this.storage.bucket(this.bucketName).file(fullPath);
        return {
            createReadStream: options => file.createReadStream(options),
            getMetadata: async () => {
                const [metadata] = await file.getMetadata();
                return [{ size: metadata.size }];
            }
        };
    }
}
