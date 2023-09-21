import {writable} from "src/engine/util/store"
import NDK, {NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"

export const ndkInstances = writable(new Map())

export const prepareNdk = ({pubkey, bunkerKey, bunkerToken}) => {
  const localSigner = new NDKPrivateKeySigner(bunkerKey)

  const instance = new NDK({
    explicitRelayUrls: ["wss://relay.f7z.io", "wss://relay.damus.io", "wss://relay.nsecbunker.com"],
  })

  const nip46Signer = new NDKNip46Signer(instance, pubkey, localSigner)

  nip46Signer.token = bunkerToken

  instance.signer = nip46Signer

  instance.connect(5000).then(() => instance.signer.blockUntilReady())

  return instance
}
