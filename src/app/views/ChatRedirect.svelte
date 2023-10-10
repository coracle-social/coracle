<script lang="ts">
  import {appName} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {router} from "src/app/router"
</script>

<Content size="lg" on:click={router.clearModals}>
  <div class="flex flex-col items-center justify-center">
    <Heading>Select Chat App</Heading>
    <p>
      {appName} is phasing out public chat. Please select an alternative chat app from the options below.
    </p>
  </div>
  <Anchor external href="https://www.nostrchat.io">
    <Card interactive class="flex flex-col gap-4">
      <p class="text-2xl">Nostrichat</p>
      <p>A clean interface that allows you to access your DMs and public group chats.</p>
    </Card>
  </Anchor>
  <Anchor external href="https://chat.coracle.social">
    <Card interactive class="flex flex-col gap-4">
      <p class="text-2xl">Coracle Chat</p>
      <p>Use the legacy version of Coracle's chat at chat.coracle.social.</p>
    </Card>
  </Anchor>
</Content>
