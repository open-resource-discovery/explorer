// Adapted from @open-resource-discovery/crawler
export { fetchOrdConfiguration, fetchOrdDocuments } from "./fetchOrd.ts";
export {
  fetchOrdDocumentForPerspective,
  type FetchOrdDocumentResult,
} from "./fetchOrdDocumentForPerspective.ts";
export {
  mergeDocuments,
  mergeDocumentsWithOptions,
  type MergeOptions,
  type MergeResult,
} from "./ordMerge.ts";
export {
  getFetchUrl,
  getBaseUrl,
  isOrdConfiguration,
  isOrdDocument,
  isRemoteUrl,
  extractPerspectives,
  DEFAULT_PERSPECTIVE,
} from "./ordUtils.ts";
export {
  customFetch,
  retryFetch,
  HttpError,
  responseValidationError,
  wait,
} from "./fetch.ts";
