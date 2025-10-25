import { AWSS3 } from "./AWSS3.js";
import { AzureBlobStorage } from "./AzureBlobStorage.js";
import { GoogleCloudStorage } from "./GoogleCloudStorage.js";
import { StorageProvider } from "./types.js";
import { InfraProvider } from "./types.js";
const instanceMap = new Map();
export function getStorageProvider(params) {
    let { storageProvider } = params || {};
    const infraProvider = process.env.INFRA_PROVIDER;
    if (!storageProvider) {
        switch (infraProvider) {
            case InfraProvider.GCP:
                storageProvider = StorageProvider.GoogleCloudStorage;
                break;
            case InfraProvider.AWS:
                storageProvider = StorageProvider.AWSS3;
                break;
            case InfraProvider.Azure:
                storageProvider = StorageProvider.AzureBlobStorage;
                break;
            default:
                throw new Error(`Unknown infra provider: ${infraProvider}`);
        }
    }
    return storageProvider;
}
export function getInstance(params) {
    const storageProvider = getStorageProvider(params);
    if (instanceMap.has(storageProvider))
        return instanceMap.get(storageProvider);
    switch (storageProvider) {
        case StorageProvider.GoogleCloudStorage:
            instanceMap.set(StorageProvider.GoogleCloudStorage, new GoogleCloudStorage());
            break;
        case StorageProvider.AWSS3:
            instanceMap.set(StorageProvider.AWSS3, new AWSS3());
            break;
        case StorageProvider.AzureBlobStorage:
            instanceMap.set(StorageProvider.AzureBlobStorage, new AzureBlobStorage());
            break;
        default:
            throw new Error(`Unknown storage provider: ${storageProvider}`);
    }
    return instanceMap.get(storageProvider);
}
