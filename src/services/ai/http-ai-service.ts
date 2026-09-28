import { RemoteAiProvider, AiError } from "./remote-provider";
export { AiError };

/**
 * Backwards-compatible export for HttpAiDeckService calling `/api/ai`.
 */
export class HttpAiDeckService extends RemoteAiProvider {}
