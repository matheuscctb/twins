export type ForgeTokenResponse = {
    access_token: string
    token_type: string
    expires_in: number
}

export type ForgeBucketResponse = {
    bucketKey: string;
    bucketOwner: string;
    createdDate: number;
    permissions: {authId: string, access: string}[]
    policyKey: string;
}

export type UrlUploadRvtResponse = {
    uploadKey: string;
    uploadExpiration: string;
    urlExpiration: string;
    urls: string[];
    contentUploadSignedURL: string;
}

export type FinalizarUploadRvtResponse = {
    bucketKey: string;
    objectId: string;
    objectKey: string;
    size: number;
    contentType: string;
    location: string;
    urn: string;
    urnEncoded: string;
}

export type iniciarTraducaoSvfResponse = {
    result: string;
    urn: string;
}

export type statusTraducaoSvfResponse = {
    type: string
    hasThumbnail: string
    status: string
    progress: string
    region: string
    urn: string
    version: string
    derivatives: {
        name?: string
        hasThumbnail?: string
        status: string
        progress: string
        messages?: {
            type: string
            code: string
            message: string[]
          }[]
        properties?: {
            "Document Information": {
                RVTVersion: string
                "Project Name": string
                "Project Number": string
                Author: string
                "Project Address": string
                "Project Issue Date": string
                "Project Status": string
                "Building Name": string
                "Client Name": string
                "Organization Name": string
                "Organization Description": string
              }
            selfDocumentIdentity: {
                instanceId: string
                revitNumberOfSaves: number
              }
          }
        extractorVersion?: string
        outputType: string
        children: {
            guid: string
            type: string
            role: string
            urn?: string
            mime?: string
            status: string
            resolution?: number[]
            name?: string
            viewableID?: string
            phaseNames?: string
            phaseIds?: string
            hasThumbnail?: string
            progress?: string
            children?: {
                guid: string
                type: string
                role: string
                name?: string
                status?: string
                progress?: string
                camera?: number[]
                urn?: string
                mime?: string
                resolution?: number[]
              }[]
          }[]
      }[]
};
