<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/router"

  const BUNKER_URL = "https://nsecbunker.com"

  const pubkeyLogIn = () => router.at("login/pubkey").replaceModal()
  const bunkerLogIn = () => router.at("login/bunker").replaceModal()
  const privkeyLogIn = () => router.at("login/privkey").replaceModal()
  const signUp = () => router.at("onboarding").replaceModal()
</script>

<div class="text-center">
  <Heading>Advanced Login</Heading>
  <p>Find more options for logging in to nostr below.</p>
</div>
<Card interactive on:click={pubkeyLogIn}>
  <FlexColumn>
    <h2 class="text-lg font-bold">Log in with npub</h2>
    <p>Use this to access a read-only view of your account (or someone else's).</p>
  </FlexColumn>
</Card>
<Card interactive on:click={bunkerLogIn}>
  <FlexColumn>
    <h2 class="text-lg font-bold">Log in with bunker</h2>
    <p>
      Keep your keys secure by storing them in an
      <Anchor external stopPropagation underline href={BUNKER_URL}>Nsec Bunker</Anchor>.
    </p>
  </FlexColumn>
</Card>
<Card interactive on:click={signUp}>
  <FlexColumn>
    <h2 class="text-lg font-bold">Create a new account</h2>
    <p>Create a fresh private key and walk through our onboarding process.</p>
  </FlexColumn>
</Card>
<Card interactive on:click={privkeyLogIn}>
  <FlexColumn>
    <h2 class="text-lg font-bold">Log in with nsec</h2>
    <p>Log in with your private key. Note that this method is not recommended!</p>
  </FlexColumn>
</Card>
