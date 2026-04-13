/**
 * Constants for Namecoin resolution.
 */
import type {ElectrumxWsServer} from "./types"

/** Default ElectrumX WebSocket servers */
export const DEFAULT_ELECTRUMX_SERVERS: ElectrumxWsServer[] = [
  {url: "wss://electrumx.testls.space:50004", label: "testls.space (WSS)"},
  {url: "ws://electrumx.testls.space:50003", label: "testls.space (WS fallback)"},
]

/** Namecoin names expire after this many blocks */
export const NAME_EXPIRE_DEPTH = 36000

/** Default cache TTL: 5 minutes */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000

// ── Namecoin script opcodes ────────────────────────────────────────────

export const OP_NAME_UPDATE = 0x53
export const OP_2DROP = 0x6d
export const OP_DROP = 0x75
export const OP_RETURN = 0x6a
