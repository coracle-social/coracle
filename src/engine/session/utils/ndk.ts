import NDK, {NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"

export const ndkInstances = new Map()

export const prepareNdk = ({pubkey, bunkerKey, bunkerToken, bunkerRelay}) => {
  const localSigner = new NDKPrivateKeySigner(bunkerKey)

  const instance = new NDK({
    explicitRelayUrls: bunkerRelay
      ? [bunkerRelay]
      : ["wss://relay.f7z.io", "wss://relay.damus.io", "wss://relay.nsecbunker.com"],
  })

  const nip46Signer = new NDKNip46Signer(instance, pubkey, localSigner)
  nip46Signer.on("authUrl", (url) => {
    const popup = window.open(url, "bunker-auth", "width=600,height=600");

    if (!popup) {
      // parse the url and add a callbackUrl with the current domain and /bunker-callback
      const urlObj = new URL(url)
      urlObj.searchParams.set("callbackUrl", `${window.location.origin}/bunker-callback`)
      window.location.href = urlObj.toString()
    }
  })

  nip46Signer.token = bunkerToken

  instance.signer = nip46Signer

  instance.connect(5000).then(() => instance.signer.blockUntilReady())

  return instance
}

export const getNdk = session => {
  if (!session?.bunkerKey) {
    return null
  }

  if (!ndkInstances.has(session.pubkey)) {
    ndkInstances.set(session.pubkey, prepareNdk(session))
  }

  return ndkInstances.get(session.pubkey)
}
