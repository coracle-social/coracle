<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {nip19} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from 'src/partials/Heading.svelte'
  import {keys} from "src/agent"
  import {toast} from "src/app"

  const {pubkey, privkey} = keys
  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"
  const keypairUrl = 'https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/'

  const copyKey = type => {
    copyToClipboard(
      type === 'private'
        ? nip19.nsecEncode($privkey)
        : nip19.npubEncode($pubkey)
    )

    toast.show("info", `Your ${type} key has been copied to the clipboard.`)
  }

  onMount(async () => {
    if (!$pubkey) {
      return navigate("/login")
    }
  })
</script>

<div in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-center items-center flex-col mb-4">
      <Heading>Your Keys</Heading>
      <p>
        Your account is identified across the network using
        a public/private <Anchor href={keypairUrl} external>keypair</Anchor>.
        This allows you to fully own your account, and move to another app if needed.
      </p>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Public Key</strong>
        <Input disabled value={$pubkey ? nip19.npubEncode($pubkey) : ''}>
          <button
            slot="after"
            class="fa-solid fa-copy cursor-pointer"
            on:click={() => copyKey('public')} />
        </Input>
        <p class="text-sm text-light">
          Your public key identifies your account. You can share this with people
          trying to find you on nostr.
        </p>
      </div>
      {#if $privkey}
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input disabled type="password" value={nip19.nsecEncode($privkey)}>
          <button
            slot="after"
            class="fa-solid fa-copy cursor-pointer"
            on:click={() => copyKey('private')} />
        </Input>
        <p class="text-sm text-light">
          Your private key is used to prove your identity by cryptographically signing
          messages. <strong>Do not share this with anyone.</strong> Be careful about
          copying this into other apps - instead, consider using
          a <Anchor href={nip07} external>compatible browser extension</Anchor> to securely
          store your key.
        </p>
      </div>
      {/if}
    </div>
  </Content>
</div>
