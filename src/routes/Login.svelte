<script>
  import {fly} from 'svelte/transition'
  import Anchor from "src/partials/Anchor.svelte"
  import {modal, login} from "src/app"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const autoLogIn = async () => {
    if (window.nostr) {
      await login({pubkey: await window.nostr.getPublicKey()})
    } else {
      modal.set({form: 'privkeyLogin'})
    }
  }

  const signUp = () => {
    modal.set({form: 'signUp'})
  }

  const pubkeyLogIn = () => {
    modal.set({form: 'pubkeyLogin'})
  }
</script>

<div class="m-auto max-w-2xl p-12" in:fly={{y: 20}}>
  <div class="flex flex-col gap-8 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Welcome!</h1>
      <i>To the Nostr Protocol</i>
    </div>
    <p class="text-center">
      To log in to existing account, simply click below. If you have
      a <Anchor href={nip07} external>compatible browser extension</Anchor> installed,
      we will use that.
    </p>
    <div class="flex flex-col gap-4 items-center">
      <div class="flex gap-4">
        <Anchor class="w-32 text-center" type="button-accent" on:click={autoLogIn}>Log In</Anchor>
        <Anchor class="w-32 text-center" type="button" on:click={signUp}>Sign Up</Anchor>
      </div>
      <Anchor type="unstyled" on:click={pubkeyLogIn}>
        <i class="fa fa-cogs" /> Advanced Login
      </Anchor>
    </div>
  </div>
</div>
