<script>
  import {onMount} from 'svelte';
  import {navigate} from 'svelte-routing'
  import {generatePrivateKey, getPublicKey} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import toast from "src/state/toast"
  import {dispatch} from "src/state/dispatch"
  import {relays} from "src/state/nostr"

  let privkey = ''
  let pubkey = ''
  let hasExtension = false

  onMount(() => {
    setTimeout(() => {
      hasExtension = !!window.nostr
    }, 1000)
  })

  const copyKey = () => {
    copyToClipboard(privkey)
    toast.show("info", "Your private key has been copied to the clipboard.")
  }

  const generateKey = () => {
    privkey = generatePrivateKey()
    toast.show("info", "Your private key has been re-generated.")
  }

  const getKeyFromExtension = async () => {
    pubkey = await window.nostr.getPublicKey()
    privkey = ''
  }

  const logIn = async () => {
    if (!privkey.match(/[a-z0-9]{64}/) && pubkey === '') {
      toast.show("error", "Sorry, but that's an invalid private key.")
    } else if (!pubkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid public key.")
    } else {
      // Generate a public key from the private key
      if (!pubkey && privkey) {
        pubkey = getPublicKey(privkey)
      }

      const {found} = await dispatch("account/init", { privkey, pubkey })

      if ($relays.length === 0) {
        navigate('/relays')
      } else if (found) {
        navigate('/notes/global')
      } else {
        navigate('/profile')
      }
    }
  }
</script>

<div class="flex justify-center p-12">
  <div class="flex flex-col gap-4 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Welcome!</h1>
      <i>To the Dogwood Social Network</i>
    </div>
    <div class="flex flex-col gap-4">
      <small>
        To log in to existing account, simply enter your private key. To create a new account, just
        let us generate one for you.
      </small>
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input type="password" bind:value={privkey} placeholder="Enter your private key">
          <i slot="after" class="fa-solid fa-copy" on:click={copyKey} />
        </Input>
        <Anchor on:click={generateKey} class="text-right">
          <small>Generate new key</small>
        </Anchor>
        <small>
          Your private key is a string of random letters and numbers that allow you to prove
          you own your account. Write it down and keep it secret!
        </small>
      </div>
      {#if hasExtension}
      <div class="flex flex-col gap-1">
        <strong>Public Key</strong>
        <Input readonly bind:value={pubkey} placeholder="Your public key will show up here" />
        <Anchor on:click={getKeyFromExtension} class="text-right">
          <small>Get from extension</small>
        </Anchor>
        <small>
          You can also use a <Anchor href="https://github.com/nostr-protocol/nips/blob/master/07.md" external>compatible browser extension</Anchor> to sign events without having to paste your private key here.
        </small>
      </div>
      {/if}
    </div>
    <Anchor class="text-center" type="button" on:click={logIn}>Log In</Anchor>
  </div>
</div>
