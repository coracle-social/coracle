import {getPublicKey} from "nostr-tools"

export const isKeyValid = (key: string) => {
  // Validate the key before setting it to state by encoding it using bech32.
  // This will error if invalid (this works whether it's a public or a private key)
  try {
    getPublicKey(key)
  } catch (e) {
    return false
  }

  return true
}
