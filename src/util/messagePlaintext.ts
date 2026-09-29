import type {ISigner} from "@welshman/signer"

// A completed plaintext cache cannot prevent multiple views/updates from asking
// the signer to decrypt the same message while its first approval is pending.
const pendingBySigner = new WeakMap<ISigner, Map<string, Promise<string>>>()

export const ensurePendingMessagePlaintext = (
  signer: ISigner,
  peer: string,
  ciphertext: string,
  decrypt: () => Promise<string>,
): Promise<string> => {
  let pending = pendingBySigner.get(signer)

  if (!pending) {
    pending = new Map()
    pendingBySigner.set(signer, pending)
  }

  const key = JSON.stringify([peer, ciphertext])
  const existing = pending.get(key)

  if (existing) return existing

  const result = Promise.resolve()
    .then(decrypt)
    .finally(() => pending.delete(key))

  pending.set(key, result)

  return result
}
