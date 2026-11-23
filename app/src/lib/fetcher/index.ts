// Adapted from @open-resource-discovery/crawler

export {
  customFetch,
  HttpError,
  responseValidationError,
  retryFetch,
  wait,
} from "./fetch.ts";
export { fetchOrdConfiguration, fetchOrdDocuments } from "./fetchOrd.ts";
export {
  type FetchOrdDocumentResult,
  fetchOrdDocumentForPerspective,
} from "./fetchOrdDocumentForPerspective.ts";
export {
  type MergeOptions,
  type MergeResult,
  mergeDocuments,
  mergeDocumentsWithOptions,
} from "./ordMerge.ts";
export {
  DEFAULT_PERSPECTIVE,
  extractPerspectives,
  getBaseUrl,
  getFetchUrl,
  isOrdConfiguration,
  isOrdDocument,
  isRemoteUrl,
} from "./ordUtils.ts";
