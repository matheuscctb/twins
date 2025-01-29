import PocketBase from "pocketbase";

const pb = (() => {
    const POCKETBASE_URL = import.meta.env.VITE_APP_POCKETBASE_ADDRESS as string;
    return new PocketBase(POCKETBASE_URL);
})();

export default pb;