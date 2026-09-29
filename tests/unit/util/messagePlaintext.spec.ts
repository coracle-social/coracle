import {describe, expect, it, vi} from "vitest"
import {Plaintext} from "@welshman/app"
import type {IApp} from "@welshman/app"
import type {ISigner} from "@welshman/signer"
import {ensurePendingMessagePlaintext} from "../../../src/util/messagePlaintext"

const signer = () => ({}) as ISigner

describe("pending message plaintext", () => {
  it("shares one signer approval between three concurrent renders", async () => {
    const owner = signer()
    const cache = new Plaintext({} as IApp)
    let resolve!: (value: string) => void
    const decrypt = vi.fn(
      () =>
        new Promise<string>(done => {
          resolve = done
        }),
    )
    const requests = Array.from({length: 3}, () =>
      ensurePendingMessagePlaintext(owner, "peer", "ciphertext", () =>
        cache.ensure("ciphertext", () => cache.ensure("ciphertext", decrypt)),
      ),
    )
    await Promise.resolve()
    expect(decrypt).toHaveBeenCalledTimes(1)
    resolve("message")
    expect(await Promise.all(requests)).toEqual(["message", "message", "message"])
  })

  it("does not merge accounts, peers or different ciphertexts", async () => {
    const owner = signer()
    const decrypt = vi.fn(async () => "message")
    await Promise.all([
      ensurePendingMessagePlaintext(owner, "a", "one", decrypt),
      ensurePendingMessagePlaintext(owner, "b", "one", decrypt),
      ensurePendingMessagePlaintext(owner, "a", "two", decrypt),
      ensurePendingMessagePlaintext(signer(), "a", "one", decrypt),
    ])
    expect(decrypt).toHaveBeenCalledTimes(4)
  })

  it("clears rejected requests so an explicit retry can succeed", async () => {
    const owner = signer()
    const decrypt = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValue("message")
    const one = ensurePendingMessagePlaintext(owner, "peer", "ciphertext", decrypt)
    const two = ensurePendingMessagePlaintext(owner, "peer", "ciphertext", decrypt)
    expect(one).toBe(two)
    await expect(one).rejects.toThrow("denied")
    await expect(ensurePendingMessagePlaintext(owner, "peer", "ciphertext", decrypt)).resolves.toBe(
      "message",
    )
    expect(decrypt).toHaveBeenCalledTimes(2)
  })

  it("does not retain plaintext after completion", async () => {
    const owner = signer()
    const decrypt = vi.fn(async () => "message")
    await ensurePendingMessagePlaintext(owner, "peer", "ciphertext", decrypt)
    await ensurePendingMessagePlaintext(owner, "peer", "ciphertext", decrypt)
    expect(decrypt).toHaveBeenCalledTimes(2)
  })
})
