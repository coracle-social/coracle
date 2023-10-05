<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/router"

  const BUNKER_URL = "https://nsecbunker.com"

  const pubkeyLogIn = () => router.at("login/pubkey").replaceModal()
  const bunkerLogIn = () => router.at("login/bunker").replaceModal()
  const privkeyLogIn = () => router.at("login/privkey").replaceModal()
  const signUp = () => router.at("onboarding").replaceModal()
</script>

<Content size="lg">
  <Content class="text-center">
    <Heading>Advanced Login</Heading>
    <p>Find more options for logging in to nostr below.</p>
  </Content>
  <Content gap="gap-4">
    <Card invertColors interactive on:click={pubkeyLogIn}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Log in with npub</h2>
        <p>Use this to access a read-only view of your account (or someone else's).</p>
      </Content>
    </Card>
    <Card invertColors interactive on:click={bunkerLogIn}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Log in with bunker</h2>
        <p>
          Keep your keys secure by storing them in an
          <Anchor external stopPropagation theme="anchor" href={BUNKER_URL}>Nsec Bunker</Anchor>.
        </p>
      </Content>
    </Card>
    <Card invertColors interactive on:click={signUp}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Create a new account</h2>
        <p>Create a fresh private key and walk through our onboarding process.</p>
      </Content>
    </Card>
    <Card invertColors interactive on:click={privkeyLogIn}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Log in with nsec</h2>
        <p>Log in with your private key. Note that this method is not recommended!</p>
      </Content>
    </Card>
  </Content>
</Content>
