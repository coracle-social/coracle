<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"

  const BUNKER_URL = "https://nsecbunker.com"

  const pubkeyLogIn = () => {
    modal.push({type: "login/pubkey"})
  }

  const bunkerLogIn = () => {
    modal.push({type: "login/bunker"})
  }
</script>

<Content size="lg">
  <Content class="text-center">
    <Heading>Advanced Login</Heading>
    <p>Find more options for logging in to nostr below.</p>
  </Content>
  <Content gap="gap-4">
    <Card interactive on:click={pubkeyLogIn}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Log in with public key</h2>
        <p>Use this to access a read-only view of your account (or someone else's).</p>
      </Content>
    </Card>
    <Card interactive on:click={bunkerLogIn}>
      <Content gap="gap-4">
        <h2 class="text-lg font-bold">Log in with Nsec Bunker</h2>
        <p>
          Keep your keys secure by storing them in a <Anchor external href={BUNKER_URL}
            >bunker</Anchor
          >.
        </p>
      </Content>
    </Card>
  </Content>
</Content>
