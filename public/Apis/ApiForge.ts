import { 
    FinalizarUploadRvtResponse,
    ForgeBucketResponse, 
    ForgeTokenResponse, 
    UrlUploadRvtResponse, 
    iniciarTraducaoSvfResponse,
    statusTraducaoSvfResponse
} from '../types/Forge';


type apiForgeInterface = () => { 
    token: () => Promise<string>;
    criarBucket: (idDaObra: string, token: string) => Promise<ForgeBucketResponse>;
    urlUploadRvt: (idDaObra: string, idDoBim: string, token: string) => Promise<UrlUploadRvtResponse>;
    uploadRvt: (urlUploadRvt: string, rvt: File) => Promise<void>;
    finalizarUploadRvt: (idDaObra: string, idDoBim: string, uploadKey: string, token: string) => Promise<FinalizarUploadRvtResponse>;
    iniciarTraducaoSvf: (urnEncoded: string, token: string) => Promise<iniciarTraducaoSvfResponse>;
    statusTraducaoSvf: (urn: string, token: string) => Promise<statusTraducaoSvfResponse>;
}

export const apiForge:apiForgeInterface = () => ({
    token: async () => {
        try {
            const details = {
                'grant_type': 'client_credentials',
                'scope': 'code:all data:write data:read bucket:create bucket:delete bucket:read',
            };
            
            const formBodyArray = [];
            for (const property  in details) {
              const encodedKey = encodeURIComponent(property);
              const encodedValue = encodeURIComponent(details[property as 'grant_type' | 'scope']);
              formBodyArray.push(encodedKey + "=" + encodedValue);
            }
            const formBodyContent = formBodyArray.join("&");

            const clientId = import.meta.env.VITE_APP_FORGE_CLIENT_ID as string;
            const clientSecret = import.meta.env.VITE_APP_FORGE_CLIENT_SECRET as string;
            const authToken = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

            const fetchResponse: Response = await fetch("https://developer.api.autodesk.com/authentication/v2/token", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Authorization': authToken,
                },
                body: formBodyContent,
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível autenticar no Forge');
            }
            const body: ForgeTokenResponse = await fetchResponse.json();
            return body.access_token;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    criarBucket: async (idDaObra: string, token: string) => {
        try {
            const fetchResponse: Response = await fetch("https://developer.api.autodesk.com/oss/v2/buckets", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    "bucketKey": idDaObra,
                    "policyKey": "transient"
                }),
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível criar o bucket');
            }
            const body: ForgeBucketResponse = await fetchResponse.json();
            return body;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    urlUploadRvt: async (idDaObra: string, idDoBim: string, token: string) => {
        try {
            const fetchResponse: Response = await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${idDaObra}/objects/${idDoBim}.rvt/signeds3upload?minutesExpiration=10`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível gerar URL para Upload de RVT no Forge');
            }
            const body: UrlUploadRvtResponse = await fetchResponse.json();
            if (body.urls.length === 0) {
                throw new Error('Não foi possível gerar URL para Upload de RVT no Forge');
            } else {
                body.contentUploadSignedURL = body.urls[0];
            }
            return body;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    uploadRvt: async (urlUploadRvt: string, rvt: File) => {
        function readFileAsArrayBuffer(file: File) {
            return new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              
              reader.onload = function(event: ProgressEvent<FileReader>) {
                if(!event.target){
                    reject();
                    return;
                }
                const arrayBuffer = event.target.result;
                resolve(arrayBuffer as ArrayBuffer);
              };
              
              reader.onerror = function(event: ProgressEvent<FileReader>) {
                if(!event.target){
                    reject();
                    return;
                }
                reject(event.target.error);
              };
              
              reader.readAsArrayBuffer(file);
            });
        }

        try {
            const arrayBuffer = await readFileAsArrayBuffer(rvt);
            console.log(arrayBuffer);
            const fetchResponse: Response = await fetch(urlUploadRvt, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                body: arrayBuffer,
            });
        
            if (fetchResponse.status !== 200) {
                console.log(fetchResponse.body);
                console.log(await fetchResponse.json());
                throw new Error('Não foi possível realizer upload do RVT no Forge');
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    finalizarUploadRvt: async (idDaObra: string, idDoBim: string, uploadKey: string, token: string) => {
        try {
            const fetchResponse: Response = await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${idDaObra}/objects/${idDoBim}.rvt/signeds3upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "uploadKey": uploadKey,
                })
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível Finalizar o Upload do arquivo RVT no Forge');
            }
            const body: FinalizarUploadRvtResponse = await fetchResponse.json();
            body.urn = body.objectId;
            body.urnEncoded = btoa(body.objectId);
            return body;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    iniciarTraducaoSvf: async (urnEncoded: string, token: string) => {
        try {
            const fetchResponse: Response = await fetch("https://developer.api.autodesk.com/modelderivative/v2/designdata/job", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    "input": {
                        "urn": urnEncoded,
                    },
                    "output": {
                        "destination": {
                            "region": "us"
                        },
                        "formats": [
                            {
                                "type": "svf",
                                "views": ["3d"]
                            }
                        ]
                    }
                }),
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível iniciar a traducao para o formato SVF');
            }
            const body: iniciarTraducaoSvfResponse = await fetchResponse.json();
            return body;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    statusTraducaoSvf: async (url_safe_urn_of_source: string, token: string) => {
        try {
            const fetchResponse: Response = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${url_safe_urn_of_source}/manifest`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            if (fetchResponse.status !== 200) {
                throw new Error('Não foi possível obter status da traducao do SVF');
            }
            const body: statusTraducaoSvfResponse = await fetchResponse.json();
            return body;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
});