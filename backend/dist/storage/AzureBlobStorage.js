import * as utils from "../utils/string.js";
import { BaseStorage } from "./BaseStorage.js";
import { StorageProvider } from "./types.js";
import { ClientSecretCredential } from '@azure/identity';
import { BlobSASPermissions, BlobServiceClient, SASProtocol, generateBlobSASQueryParameters } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import { PassThrough, Readable } from 'stream';
dotenv.config();
export class AzureBlobStorage extends BaseStorage {
    blobServiceClient;
    containerName;
    basePath;
    constructor() {
        super();
        this.containerName = process.env.BUCKET_NAME || '';
        this.basePath = process.env.STORAGE_BASE_PATH || '';
        const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const clientId = process.env.AZURE_CLIENT_ID;
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        if (!accountName)
            throw new Error('AZURE_STORAGE_ACCOUNT_NAME is required');
        if (!clientId)
            throw new Error('AZURE_CLIENT_ID is required');
        if (!tenantId)
            throw new Error('AZURE_TENANT_ID is required');
        if (!clientSecret)
            throw new Error('AZURE_CLIENT_SECRET is required');
        if (!this.containerName) {
            throw new Error('BUCKET_NAME  is required');
        }
        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        this.blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
    }
    getStorageProviderName() {
        return StorageProvider.AzureBlobStorage;
    }
    getFullPath(key) {
        return this.basePath ? `${this.basePath.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}` : key;
    }
    async uploadFile(params) {
        const { srcFilePath, destinationKey } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(destinationKey));
        await blockBlobClient.uploadFile(srcFilePath);
    }
    async uploadData(params) {
        const { data, destinationKey, contentType } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(destinationKey));
        await blockBlobClient.upload(data, Buffer.byteLength(data), {
            blobHTTPHeaders: contentType ? { blobContentType: contentType } : undefined
        });
    }
    async downloadDocument(params) {
        const { srcKey, destinationFilePath } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(srcKey));
        await blockBlobClient.downloadToFile(this.getFullPath(destinationFilePath));
    }
    async getData(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const downloadResponse = await blockBlobClient.download(0);
        const chunks = [];
        if (!downloadResponse.readableStreamBody) {
            throw new Error('No readable stream available');
        }
        for await (const chunk of downloadResponse.readableStreamBody) {
            if (Buffer.isBuffer(chunk)) {
                chunks.push(chunk);
            }
            else if (chunk && typeof chunk === 'object') {
                chunks.push(Buffer.from(chunk));
            }
            else {
                chunks.push(Buffer.from(String(chunk)));
            }
        }
        return Buffer.concat(chunks);
    }
    async generateDownloadSignedUrl(params) {
        const { key, fileName = `file-${utils.getRandomString('numeric', 4)}` } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const startsOn = new Date();
        const expiresOn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // Get user delegation key
        const userDelegationKey = await this.blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
        const sasOptions = {
            containerName: this.containerName,
            blobName: this.getFullPath(key),
            permissions: BlobSASPermissions.parse('r'),
            startsOn,
            expiresOn,
            protocol: SASProtocol.Https,
            ...(fileName && { contentDisposition: `attachment; filename="${fileName}"` })
        };
        const sasToken = generateBlobSASQueryParameters(sasOptions, userDelegationKey, this.blobServiceClient.accountName).toString();
        return `${blockBlobClient.url}?${sasToken}`;
    }
    async deleteFile(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        await blockBlobClient.delete();
    }
    async generateUploadSignedUrl(params) {
        const { key, contentType } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const startsOn = new Date();
        const expiresOn = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
        // Get user delegation key
        const userDelegationKey = await this.blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
        const sasOptions = {
            containerName: this.containerName,
            blobName: this.getFullPath(key),
            permissions: BlobSASPermissions.parse('cw'),
            startsOn,
            expiresOn,
            protocol: process.env.ENV !== 'local' ? SASProtocol.Https : SASProtocol.HttpsAndHttp,
            contentType: contentType || 'application/octet-stream'
        };
        const sasToken = generateBlobSASQueryParameters(sasOptions, userDelegationKey, this.blobServiceClient.accountName).toString();
        return { url: `${blockBlobClient.url}?${sasToken}`, headers: { 'x-ms-blob-type': 'BlockBlob' } };
    }
    async documentExists(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        return await blockBlobClient.exists();
    }
    async copyFile(params) {
        const { srcKey, destinationKey } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const sourceBlockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(srcKey));
        const destinationBlockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(destinationKey));
        const sourceUrl = sourceBlockBlobClient.url;
        await destinationBlockBlobClient.beginCopyFromURL(sourceUrl);
    }
    async getFileMetadata(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const properties = await blockBlobClient.getProperties();
        return { size: properties.contentLength };
    }
    async createReadStream(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const downloadResponse = await blockBlobClient.download(0);
        if (!downloadResponse.readableStreamBody) {
            throw new Error('No readable stream available');
        }
        return downloadResponse.readableStreamBody;
    }
    // eslint-disable-next-line require-await
    async createWriteStream(params) {
        const { key, contentType } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(this.getFullPath(key));
        const passThrough = new PassThrough();
        // Start uploading from the stream
        const uploadPromise = blockBlobClient.uploadStream(passThrough, undefined, undefined, {
            blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' }
        });
        uploadPromise.then(() => passThrough.emit('finish')).catch(err => passThrough.emit('error', err));
        return passThrough;
    }
    getRawFile(params) {
        const { key } = params;
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blobClient = containerClient.getBlobClient(this.getFullPath(key));
        return {
            createReadStream: options => {
                const start = options?.start;
                const end = options?.end;
                const count = end !== undefined && start !== undefined ? end - start + 1 : undefined;
                const stream = new Readable({
                    async read() {
                        const downloadResponse = await blobClient.download(start, count);
                        const body = downloadResponse.readableStreamBody;
                        if (body) {
                            body.on('data', chunk => this.push(chunk));
                            body.on('end', () => this.push(null));
                            body.on('error', err => this.destroy(err));
                        }
                        else {
                            this.push(null);
                        }
                    }
                });
                return stream;
            },
            getMetadata: async () => {
                const properties = await blobClient.getProperties();
                return [{ size: properties.contentLength }];
            }
        };
    }
}
