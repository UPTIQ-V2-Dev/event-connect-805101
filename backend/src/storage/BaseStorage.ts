import { StorageFile, StorageProvider } from './types.ts';
import { Readable, Writable } from 'stream';

export abstract class BaseStorage {
    abstract getStorageProviderName(): StorageProvider;
    abstract uploadFile(params: { bucketName: string; srcFilePath: string; destinationKey: string }): Promise<void>;
    abstract uploadData(params: {
        bucketName: string;
        data: string | Buffer;
        destinationKey: string;
        contentType?: string;
    }): Promise<void>;
    abstract getData(params: { bucketName: string; key: string }): Promise<Buffer>;
    abstract downloadDocument(params: {
        bucketName: string;
        srcKey: string;
        destinationFilePath: string;
    }): Promise<void>;
    abstract generateDownloadSignedUrl(params: { bucketName: string; key: string; fileName?: string }): Promise<string>;
    abstract deleteFile(params: { bucketName: string; key: string }): Promise<void>;
    abstract generateUploadSignedUrl(params: {
        bucketName: string;
        key: string;
        contentType?: string;
    }): Promise<{ url: string; headers?: Record<string, string> }>;
    abstract documentExists(params: { bucketName: string; key: string }): Promise<boolean>;
    abstract copyFile(params: { bucketName: string; srcKey: string; destinationKey: string }): Promise<void>;
    abstract getFileMetadata(params: { bucketName: string; key: string }): Promise<{ size?: number }>;
    abstract createReadStream(params: { bucketName: string; key: string }): Promise<Readable>;
    abstract createWriteStream(params: { bucketName: string; key: string; contentType?: string }): Promise<Writable>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRawFile(params: { bucketName: string; key: string }): StorageFile {
        throw new Error('Method not implementation');
    }
}
