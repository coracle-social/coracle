import {derived, writable} from "src/engine2/util/store"
import NDK, {NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"

const instances = writable(new Map())

const prepareNDK = ({pubkey, bunkerKey, bunkerToken}) => {
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

export const deriveNDK = user =>
  derived([user, instances], ([$user, $instances]) => {
    if (!$user?.bunkerToken) {
      return null
    }

    if (!$instances.has($user.pubkey)) {
      $instances.set($user.pubkey, prepareNDK($user))
    }

    return $instances.get($user.pubkey)
  })
