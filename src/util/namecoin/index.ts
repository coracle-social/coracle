/**
 * Namecoin NIP-05 Resolution — barrel export.
 *
 * All public APIs are re-exported here so that existing imports
 * from "src/util/namecoin" continue to work unchanged.
 */

// Types
export type {
  NamecoinNostrResult,
  NameShowResult,
  NamecoinSettings,
  NamecoinResolveOutcome,
  ElectrumxWsServer,
  ParsedNamecoinIdentifier,
} from "./types"

// Constants
export {
  DEFAULT_ELECTRUMX_SERVERS,
  NAME_EXPIRE_DEPTH,
  DEFAULT_CACHE_TTL,
  OP_NAME_UPDATE,
  OP_2DROP,
  OP_DROP,
  OP_RETURN,
} from "./constants"

// ElectrumX WebSocket client
export {nameShowWs, nameShowWithFallback} from "./electrumx-ws"

// Resolver — main API
export {
  isNamecoinIdentifier,
  parseNamecoinIdentifier,
  parseIdentifier,
  resolveNamecoin,
  resolveNamecoinDetailed,
  resolveNamecoinCached,
  resolveNamecoinWithSettings,
  verifyNamecoinNip05,
  verifyNamecoinWithSettings,
  setNamecoinSettingsAccessor,
  getRuntimeSettings,
  getCached,
  setCache,
  clearCache,
  parseServerString,
  formatServerString,
  DEFAULT_NAMECOIN_SETTINGS,
} from "./resolver"
