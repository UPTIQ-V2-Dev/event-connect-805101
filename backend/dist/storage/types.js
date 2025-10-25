export var StorageProvider;
(function (StorageProvider) {
    StorageProvider["GoogleCloudStorage"] = "GoogleCloudStorage";
    StorageProvider["AWSS3"] = "AWSS3";
    StorageProvider["AzureBlobStorage"] = "AzureBlobStorage";
})(StorageProvider || (StorageProvider = {}));
export var InfraProvider;
(function (InfraProvider) {
    InfraProvider["GCP"] = "GCP";
    InfraProvider["AWS"] = "AWS";
    InfraProvider["Azure"] = "Azure";
})(InfraProvider || (InfraProvider = {}));
