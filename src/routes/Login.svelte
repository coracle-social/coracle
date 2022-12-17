<script>
  import {onMount} from 'svelte'
  import {fade} from 'svelte/transition'
  import {navigate} from 'svelte-routing'
  import {generatePrivateKey, getPublicKey} from 'nostr-tools'
  import {copyToClipboard} from "src/util/html"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import toast from "src/state/toast"
  import {dispatch} from "src/state/dispatch"
  import {user} from "src/state/app"

  let privkey = ''
  let hasExtension = false

  onMount(() => {
    setTimeout(() => {
      hasExtension = !!window.nostr
    }, 1000)
  })

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const copyKey = () => {
    copyToClipboard(privkey)
    toast.show("info", "Your private key has been copied to the clipboard.")
  }

  const generateKey = () => {
    privkey = generatePrivateKey()
    toast.show("info", "Your private key has been re-generated.")
  }

  const logIn = async ({privkey, pubkey}) => {
    const person = await dispatch("user/init", pubkey)

    user.set({...person, pubkey, privkey})

    navigate('/notes/global')
  }

  const logInWithExtension = async () => {
    const pubkey = await window.nostr.getPublicKey()

    if (!pubkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid public key.")
    } else {
      logIn({pubkey})
    }
  }

  const logInWithPrivateKey = async () => {
    if (!privkey.match(/[a-z0-9]{64}/)) {
      toast.show("error", "Sorry, but that's an invalid private key.")
    } else {
      logIn({privkey, pubkey: getPublicKey(privkey)})
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
        let us generate one for you. You can also use
        a <Anchor href={nip07} external>compatible browser extension</Anchor> to
        sign events without having to paste your private key here.
      </small>
      <div class="flex flex-col gap-1">
        <strong>Private Key</strong>
        <Input type="password" bind:value={privkey} placeholder="Enter your private key">
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
    <Anchor class="text-center" type="button" on:click={logInWithPrivateKey}>Log In</Anchor>
  </div>
</div>
