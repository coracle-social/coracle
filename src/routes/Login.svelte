<script>
  import {onMount} from 'svelte'
  import {fade, fly} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {generatePrivateKey, getPublicKey} from 'nostr-tools'
  import {nip19} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import {toast, login} from "src/app"

  let nsec = ''
  let hasExtension = false
  let loading = false

  onMount(() => {
    setTimeout(() => {
      hasExtension = !!window.nostr
    }, 1000)
  })

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const copyKey = () => {
    copyToClipboard(nsec)
    toast.show("info", "Your private key has been copied to the clipboard.")
  }

  const generateKey = () => {
    nsec = nip19.nsecEncode(generatePrivateKey())
    toast.show("info", "Your private key has been re-generated.")
  }

  const logIn = async ({privkey, pubkey}) => {
    loading = true

    login({privkey, pubkey})

    navigate('/relays')
  }

  const logInWithExtension = async () => {
    const pubkey = await window.nostr.getPublicKey()

    if (!pubkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid public key.")
    } else {
      await logIn({pubkey})
    }
  }

  const logInWithPrivateKey = async () => {
    const privkey = nsec.startsWith('nsec') ? nip19.decode(nsec).data : nsec

    if (!privkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid private key.")
    } else {
      await logIn({privkey, pubkey: getPublicKey(privkey)})
    }
  }
</script>

<div class="flex justify-center p-12" in:fly={{y: 20}}>
  <div class="flex flex-col gap-4 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Welcome!</h1>
      <i>To the Nostr Protocol</i>
    </div>
    <div class="flex flex-col gap-4">
      <p>
        To log in to existing account, simply enter your private key below. To create a new account,
        just let us generate one for you.
      </p>
      <p>
        You can also use a <Anchor href={nip07} external>compatible browser extension</Anchor> to
        sign events without having to paste your private key here (recommended).
      </p>
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input type="password" bind:value={nsec} placeholder="Enter your private key">
          <i slot="after" class="fa-solid fa-copy" on:click={copyKey} />
        </Input>
        <div class="flex justify-end gap-2">
          {#if hasExtension}
          <div in:fade>
            <Anchor on:click={logInWithExtension} class="text-sm">Get from extension</Anchor>
          </div>
          {/if}
          <div>
            <Anchor on:click={generateKey} class="text-sm">Generate new key</Anchor>
          </div>
        </div>
        <small>
          Your private key is a string of random letters and numbers that allow you to prove
          you own your account. Write it down and keep it secret!
        </small>
      </div>
    </div>
    <Anchor class="text-center" type="button" on:click={logInWithPrivateKey} {loading}>
      Log In
    </Anchor>
  </div>
</div>
