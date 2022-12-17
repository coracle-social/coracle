<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {copyToClipboard} from "src/util/html"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {user} from "src/state/app"
  import toast from "src/state/toast"

  const keypairUrl = 'https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/'
  const delegationUrl = 'https://github.com/nostr-protocol/nips/blob/b62aa418dee13aac1899ea7c6946a0f55dd7ee84/26.md'

  const copyKey = type => {
    copyToClipboard(type === 'private' ? $user.privkey : $user.pubkey)

    toast.show("info", `Your ${type} key has been copied to the clipboard.`)
  }

  onMount(async () => {
    if (!$user) {
      return navigate("/login")
    }
  })
</script>

<div class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
  <div class="flex flex-col gap-4 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Your Keys</h1>
      <p>
        Your account is identified across the network using
        a public/private <Anchor href={keypairUrl} external>keypair</Anchor>.
        This allows you to fully own your account, and move to another app if needed.
      </p>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Public Key</strong>
        <Input disabled value={$user?.pubkey}>
          <i slot="after" class="fa-solid fa-copy cursor-pointer" on:click={() => copyKey('public')} />
        </Input>
        <p class="text-sm text-light">
          Your public key identifies your account. You can share this with people
          trying to find you on nostr.
        </p>
      </div>
      {#if $user?.privkey}
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input disabled type="password" value={$user?.privkey}>
          <i slot="after" class="fa-solid fa-copy cursor-pointer" on:click={() => copyKey('private')} />
        </Input>
        <p class="text-sm text-light">
          Your private key is used to prove your identity by cryptographically signing
          messages. <strong>Do not share this with anyone.</strong> Be careful about
          copying this into other apps - instead, consider
          using <Anchor external href={delegationUrl}>delegation keys</Anchor> instead.
        </p>
      </div>
      {/if}
    </div>
  </div>
</div>
