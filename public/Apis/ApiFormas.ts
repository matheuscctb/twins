import { RecordFullListQueryParams } from 'pocketbase';
import pb from '../imports/pb';
import { PocketbaseRecord } from '../types';
import { Forma } from '../types/Forma';

type apiFormasInterface = () => { 
    todasAsFormas: (queryParams?: RecordFullListQueryParams) => Promise<(Forma & PocketbaseRecord)[]>; 
    cadastrarForma: (forma: Forma) => Promise<Forma & PocketbaseRecord>;
    atualizarForma: (id: string, forma: Forma) => Promise<Forma & PocketbaseRecord>;
}

export const apiFormas:apiFormasInterface = () => ({
    todasAsFormas: async (queryParams?: RecordFullListQueryParams) => {
        return await pb.collection('formas').getFullList(queryParams);
    },
    cadastrarForma: async(forma: Forma) => {
        return await pb
        .collection("formas")
        .create<PocketbaseRecord & Forma>(forma);
    },
    atualizarForma: async(id: string, forma: Forma) => {
        return await pb.collection('formas').update<Forma & PocketbaseRecord>(id, forma);
    },
});