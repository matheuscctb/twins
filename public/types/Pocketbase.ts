export type PocketbaseRecord = {
    id: string,
    collectionId: string,
    collectionName: string,
    created: string,
    updated: string,
}

export type PocketbaseError = {
    code: number,
    message: string,
}