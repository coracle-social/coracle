<script lang="ts">
  import {Capacitor} from "@capacitor/core"
  import {fly} from "src/util/transition"
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

  const advancedLogIn = () => {
    modal.push({type: "login/advanced"})
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
        Click below to log in or create an account.
        {#if !Capacitor.isNativePlatform()}
          If you have a <Anchor class="underline" href={nip07} external
            >compatible browser extension</Anchor> installed, we will use that.
        {/if}
      </p>
      <div class="flex flex-col items-center gap-4">
        <div class="flex gap-4">
          <Anchor class="w-32 text-center" theme="button-accent" on:click={autoLogIn}
            >Log In</Anchor>
          <Anchor class="w-32 text-center" theme="button" on:click={signUp}>Sign Up</Anchor>
        </div>
        <Anchor on:click={advancedLogIn}>
          <i class="fa fa-cogs" /> Advanced Login
        </Anchor>
      </div>
    </div>
  </Content>
</div>
