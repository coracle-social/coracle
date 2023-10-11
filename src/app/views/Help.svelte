<script lang="ts">
  import {toTitle} from "hurdak"
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"

  export let topic

  const descriptions = {
    "web-of-trust": `WoT (Web Of Trust) is one of the best ways to determine how trustworthy someone might be, based on your social graph.\nIn ${appName}, this number is calculated by how many people you follow also follow that person. This allows you to see at a glance if someone is already in your network. This helps reduce spam, impostors, and objectionable content.\nYou can set a minimum web of trust score on your content settings page, which will automatically mute anyone with a lower score than your threshold.`,
  }
</script>

<Content>
  {#if descriptions[topic]}
    <Heading>{toTitle(topic)}</Heading>
    <p>{@html descriptions[topic].replace(/\n/g, "<br /><br />")}</p>
  {:else}
    <Heading>No information on "{toTitle(topic)}"</Heading>
    <p>Sorry, we couldn't find any information on "{toTitle(topic)}".</p>
  {/if}
</Content>
