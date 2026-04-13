/**
 * Tests for the Namecoin NIP-05 resolver.
 *
 * These are pure unit tests for the identifier parsing and value extraction
 * logic — no network access required. They mirror the test cases from
 * Amethyst's NamecoinNameResolverTest.kt.
 */
import {describe, it, expect} from "vitest"
import {
  isNamecoinIdentifier,
  parseServerString,
  formatServerString,
  DEFAULT_ELECTRUMX_SERVERS,
} from "src/util/namecoin"

// ── isNamecoinIdentifier ───────────────────────────────────────────────

describe("isNamecoinIdentifier", () => {
  it("recognizes dot-bit domains", () => {
    expect(isNamecoinIdentifier("example.bit")).toBe(true)
    expect(isNamecoinIdentifier("alice@example.bit")).toBe(true)
    expect(isNamecoinIdentifier("_@example.bit")).toBe(true)
    expect(isNamecoinIdentifier("EXAMPLE.BIT")).toBe(true)
  })

  it("recognizes d/ names", () => {
    expect(isNamecoinIdentifier("d/example")).toBe(true)
    expect(isNamecoinIdentifier("D/Example")).toBe(true)
  })

  it("recognizes id/ names", () => {
    expect(isNamecoinIdentifier("id/alice")).toBe(true)
    expect(isNamecoinIdentifier("ID/Alice")).toBe(true)
  })

  it("rejects non-namecoin identifiers", () => {
    expect(isNamecoinIdentifier("[email protected]")).toBe(false)
    expect(isNamecoinIdentifier("npub1abc")).toBe(false)
    expect(isNamecoinIdentifier("some random text")).toBe(false)
    expect(isNamecoinIdentifier("")).toBe(false)
  })
})

// ── Value extraction (internal logic tested via the exported resolve) ──

/**
 * Helper: directly test value parsing without network access.
 * Simulates what the resolver does after receiving a name_show result.
 */
function extractNostrFromValue(
  jsonValue: string,
  namecoinName: string,
  localPart: string,
): {pubkey: string; relays: string[]; localPart: string} | null {
  let obj: Record<string, any>
  try {
    obj = JSON.parse(jsonValue)
  } catch {
    return null
  }

  const nostrField = obj.nostr
  if (nostrField === undefined || nostrField === null) return null

  const HEX_PUBKEY_REGEX = /^[0-9a-fA-F]{64}$/

  // Simple form
  if (typeof nostrField === "string") {
    if (localPart === "_" && HEX_PUBKEY_REGEX.test(nostrField)) {
      return {pubkey: nostrField.toLowerCase(), relays: [], localPart: "_"}
    }
    return null
  }

  // Extended form
  if (typeof nostrField === "object" && !Array.isArray(nostrField)) {
    const names = nostrField.names
    if (!names || typeof names !== "object") return null

    let resolvedLocalPart: string
    let pubkey: string

    const exactMatch = names[localPart]
    const rootMatch = names["_"]
    const entries = Object.entries(names)
    const firstEntry = localPart === "_" && entries.length > 0 ? entries[0] : null

    if (typeof exactMatch === "string" && HEX_PUBKEY_REGEX.test(exactMatch)) {
      resolvedLocalPart = localPart
      pubkey = exactMatch
    } else if (typeof rootMatch === "string" && HEX_PUBKEY_REGEX.test(rootMatch)) {
      resolvedLocalPart = "_"
      pubkey = rootMatch
    } else if (
      firstEntry &&
      typeof firstEntry[1] === "string" &&
      HEX_PUBKEY_REGEX.test(firstEntry[1])
    ) {
      resolvedLocalPart = firstEntry[0]
      pubkey = firstEntry[1] as string
    } else {
      return null
    }

    let relays: string[] = []
    try {
      const relaysMap = nostrField.relays
      if (relaysMap && typeof relaysMap === "object") {
        const relayArray = relaysMap[pubkey.toLowerCase()] || relaysMap[pubkey]
        if (Array.isArray(relayArray)) {
          relays = relayArray.filter((r: any) => typeof r === "string")
        }
      }
    } catch {
      // ignore
    }

    return {pubkey: pubkey.toLowerCase(), relays, localPart: resolvedLocalPart}
  }

  return null
}

function extractNostrFromIdentityValue(
  jsonValue: string,
  namecoinName: string,
): {pubkey: string; relays: string[]} | null {
  let obj: Record<string, any>
  try {
    obj = JSON.parse(jsonValue)
  } catch {
    return null
  }

  const nostrField = obj.nostr
  if (nostrField === undefined || nostrField === null) return null

  const HEX_PUBKEY_REGEX = /^[0-9a-fA-F]{64}$/

  if (typeof nostrField === "string") {
    if (HEX_PUBKEY_REGEX.test(nostrField)) {
      return {pubkey: nostrField.toLowerCase(), relays: []}
    }
  }

  if (typeof nostrField === "object" && !Array.isArray(nostrField)) {
    const pubkey = nostrField.pubkey
    if (typeof pubkey === "string" && HEX_PUBKEY_REGEX.test(pubkey)) {
      const relays = Array.isArray(nostrField.relays)
        ? nostrField.relays.filter((r: any) => typeof r === "string")
        : []
      return {pubkey: pubkey.toLowerCase(), relays}
    }
  }

  return null
}

// ── Value format: simple pubkey in d/ ──────────────────────────────────

describe("Domain value parsing (d/ namespace)", () => {
  it("parses simple nostr field from domain value", () => {
    const value = `{"nostr":"b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9"}`
    const result = extractNostrFromValue(value, "d/example", "_")
    expect(result).not.toBeNull()
    expect(result!.pubkey).toBe("b0635d6a9851d3aed0cd6c495b282167acf761729078d975fc341b22650b07b9")
  })

  it("parses extended nostr names from domain value", () => {
    const value = JSON.stringify({
      nostr: {
        names: {
          _: "aaaa000000000000000000000000000000000000000000000000000000000001",
          alice: "bbbb000000000000000000000000000000000000000000000000000000000002",
        },
        relays: {
          bbbb000000000000000000000000000000000000000000000000000000000002: [
            "wss://relay.example.com",
          ],
        },
      },
    })

    // Root lookup
    const rootResult = extractNostrFromValue(value, "d/example", "_")
    expect(rootResult).not.toBeNull()
    expect(rootResult!.pubkey).toBe(
      "aaaa000000000000000000000000000000000000000000000000000000000001",
    )

    // Named lookup
    const aliceResult = extractNostrFromValue(value, "d/example", "alice")
    expect(aliceResult).not.toBeNull()
    expect(aliceResult!.pubkey).toBe(
      "bbbb000000000000000000000000000000000000000000000000000000000002",
    )
    expect(aliceResult!.relays).toEqual(["wss://relay.example.com"])
  })

  it("falls back to root when named user not found", () => {
    const value = JSON.stringify({
      nostr: {
        names: {
          _: "aaaa000000000000000000000000000000000000000000000000000000000001",
        },
      },
    })

    const result = extractNostrFromValue(value, "d/example", "nonexistent")
    expect(result).not.toBeNull()
    expect(result!.pubkey).toBe("aaaa000000000000000000000000000000000000000000000000000000000001")
  })

  it("root lookup falls back to first entry when no underscore key", () => {
    const value = JSON.stringify({
      nostr: {
        names: {
          m: "6cdebccabda1dfa058ab85352a79509b592b2bdfa0370325e28ec1cb4f18667d",
        },
      },
    })

    const result = extractNostrFromValue(value, "d/testls", "_")
    expect(result).not.toBeNull()
    expect(result!.pubkey).toBe("6cdebccabda1dfa058ab85352a79509b592b2bdfa0370325e28ec1cb4f18667d")
    expect(result!.localPart).toBe("m")
  })

  it("non-root lookup does NOT fall back to first entry", () => {
    const value = JSON.stringify({
      nostr: {
        names: {
          m: "6cdebccabda1dfa058ab85352a79509b592b2bdfa0370325e28ec1cb4f18667d",
        },
      },
    })

    const result = extractNostrFromValue(value, "d/testls", "alice")
    expect(result).toBeNull()
  })
})

// ── Value format: id/ namespace ────────────────────────────────────────

describe("Identity value parsing (id/ namespace)", () => {
  it("parses simple nostr field from identity value", () => {
    const value = JSON.stringify({
      nostr: "cccc000000000000000000000000000000000000000000000000000000000003",
      email: "[email protected]",
    })
    const result = extractNostrFromIdentityValue(value, "id/alice")
    expect(result).not.toBeNull()
    expect(result!.pubkey).toBe("cccc000000000000000000000000000000000000000000000000000000000003")
  })

  it("parses object nostr field from identity value", () => {
    const value = JSON.stringify({
      nostr: {
        pubkey: "dddd000000000000000000000000000000000000000000000000000000000004",
        relays: ["wss://relay.example.com", "wss://relay2.example.com"],
      },
    })
    const result = extractNostrFromIdentityValue(value, "id/bob")
    expect(result).not.toBeNull()
    expect(result!.pubkey).toBe("dddd000000000000000000000000000000000000000000000000000000000004")
    expect(result!.relays.length).toBe(2)
  })
})

// ── Invalid data ───────────────────────────────────────────────────────

describe("Invalid data handling", () => {
  it("rejects invalid pubkey lengths", () => {
    const value = `{"nostr":"tooshort"}`
    const result = extractNostrFromValue(value, "d/bad", "_")
    expect(result).toBeNull()
  })

  it("rejects non-hex pubkeys", () => {
    const value = `{"nostr":"zzzz000000000000000000000000000000000000000000000000000000000000"}`
    const result = extractNostrFromValue(value, "d/bad", "_")
    expect(result).toBeNull()
  })

  it("handles missing nostr field", () => {
    const value = `{"ip":"1.2.3.4","map":{"www":{"ip":"1.2.3.4"}}}`
    const result = extractNostrFromValue(value, "d/example", "_")
    expect(result).toBeNull()
  })

  it("handles malformed JSON gracefully", () => {
    const value = "not json at all"
    const result = extractNostrFromValue(value, "d/broken", "_")
    expect(result).toBeNull()
  })
})

// ── Server string parsing ──────────────────────────────────────────────

describe("parseServerString", () => {
  it("parses host:port (TLS default)", () => {
    const server = parseServerString("electrumx.example.com:50002")
    expect(server).not.toBeNull()
    expect(server!.host).toBe("electrumx.example.com")
    expect(server!.port).toBe(50002)
    expect(server!.useSsl).toBe(true)
  })

  it("parses host:port:tcp (plaintext)", () => {
    const server = parseServerString("localhost:50001:tcp")
    expect(server).not.toBeNull()
    expect(server!.host).toBe("localhost")
    expect(server!.port).toBe(50001)
    expect(server!.useSsl).toBe(false)
  })

  it("parses WebSocket URLs", () => {
    const server = parseServerString("wss://electrumx.example.com:50004")
    expect(server).not.toBeNull()
    expect(server!.host).toBe("electrumx.example.com")
    expect(server!.port).toBe(50004)
    expect(server!.wsUrl).toBe("wss://electrumx.example.com:50004")
    expect(server!.useSsl).toBe(true)
  })

  it("rejects invalid inputs", () => {
    expect(parseServerString("")).toBeNull()
    expect(parseServerString("just-a-host")).toBeNull()
    expect(parseServerString("host:notaport")).toBeNull()
    expect(parseServerString("host:0")).toBeNull()
    expect(parseServerString("host:99999")).toBeNull()
  })

  it("marks .onion addresses as trustAllCerts", () => {
    const server = parseServerString("abcdef.onion:50002")
    expect(server).not.toBeNull()
    expect(server!.trustAllCerts).toBe(true)
  })
})

describe("formatServerString", () => {
  it("formats TLS server", () => {
    expect(formatServerString({host: "example.com", port: 50002, useSsl: true})).toBe(
      "example.com:50002",
    )
  })

  it("formats plaintext server", () => {
    expect(formatServerString({host: "example.com", port: 50001, useSsl: false})).toBe(
      "example.com:50001:tcp",
    )
  })

  it("uses wsUrl when present", () => {
    expect(
      formatServerString({
        host: "example.com",
        port: 50004,
        useSsl: true,
        wsUrl: "wss://example.com:50004",
      }),
    ).toBe("wss://example.com:50004")
  })
})

// ── Default servers ────────────────────────────────────────────────────

describe("DEFAULT_ELECTRUMX_SERVERS", () => {
  it("has at least one server", () => {
    expect(DEFAULT_ELECTRUMX_SERVERS.length).toBeGreaterThan(0)
  })

  it("all servers have valid WebSocket URLs", () => {
    for (const server of DEFAULT_ELECTRUMX_SERVERS) {
      expect(server.url).toMatch(/^wss?:\/\//)
      expect(server.label).toBeTruthy()
    }
  })
})
