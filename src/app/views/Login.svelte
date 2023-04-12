<script lang="ts">
  import {fly} from "svelte/transition"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import user from "src/agent/user"
  import {login} from "src/app/state"

  const nip07 = "https://github.com/nostr-protocol/nips/blob/master/07.md"

  const autoLogIn = async () => {
    const {nostr} = window as any

    if (nostr) {
      login("extension", await nostr.getPublicKey())
    } else {
      modal.push({type: "login/privkey"})
    }
  }

  const signUp = () => {
    modal.push({type: "onboarding", stage: "intro"})
  }

  const pubkeyLogIn = () => {
    modal.push({type: "login/pubkey"})
  }

  if (user.getPubkey()) {
    navigate("/")
  }

  document.title = "Log In"
</script>

<div in:fly={{y: 20}}>
  <Content size="lg" class="text-center">
    <div class="flex max-w-2xl flex-col gap-8">
      <div class="mb-4 flex flex-col items-center justify-center">
        <Heading>Welcome!</Heading>
        <i>To the Nostr Network</i>
      </div>
      <p class="text-center">
        Click below to log in or create an account. If you have a <Anchor href={nip07} external
          >compatible browser extension</Anchor> installed, we will use that.
      </p>
      <div class="flex flex-col items-center gap-4">
        <div class="flex gap-4">
          <Anchor class="w-32 text-center" type="button-accent" on:click={autoLogIn}>Log In</Anchor>
          <Anchor class="w-32 text-center" type="button" on:click={signUp}>Sign Up</Anchor>
        </div>
        <Anchor type="unstyled" on:click={pubkeyLogIn}>
          <i class="fa fa-cogs" /> Advanced Login
        </Anchor>
      </div>
    </div>
  </Content>
</div>
