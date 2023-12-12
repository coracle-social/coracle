<script lang="ts">
  import {toTitle} from "hurdak"
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"

  export let topic

  const descriptions = {
    "web-of-trust": `WoT (Web Of Trust) is one of the best ways to determine how trustworthy someone might be, based on your social graph.\nIn ${appName}, this number is equal to how many people you follow that also follow a given person, minus <span class="code">pow(2, log(n))</span>, where <span class="code">n</span> is how many people you follow who have muted this person. This allows you to see at a glance if someone is accepted in your network. This helps reduce spam, impostors, and objectionable content.\nYou can set a minimum web of trust score on your content settings page, which will automatically mute anyone with a lower score than your threshold.`,
  }
</script>

{#if descriptions[topic]}
  <Heading>{toTitle(topic)}</Heading>
  <p>{@html descriptions[topic].replace(/\n/g, "<br /><br />")}</p>
{:else}
  <Heading>No information on "{toTitle(topic)}"</Heading>
  <p>Sorry, we couldn't find any information on "{toTitle(topic)}".</p>
{/if}
