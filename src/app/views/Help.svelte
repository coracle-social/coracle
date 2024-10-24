<script lang="ts">
  import {toTitle} from "hurdak"
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"

  export let topic

  const topics = ["web-of-trust", "nip-17-dms"]
  const nip17Url = "https://github.com/nostr-protocol/nips/blob/master/17.md"
</script>

{#if topics.includes(topic)}
  <Heading>{toTitle(topic)}</Heading>
  {#if topic === "web-of-trust"}
    <p>
      WoT (Web Of Trust) is one of the best ways to determine how trustworthy someone might be,
      based on your social graph.
    </p>
    <p>
      In {appName}, this number is equal to how many people you follow that also follow a given
      person, minus how many people you follow who have muted this person. This allows you to see at
      a glance if someone is accepted in your network. This helps reduce spam, impostors, and
      objectionable content.
    </p>
    <p>
      You can set a minimum web of trust score on your content settings page, which will
      automatically mute anyone with a lower score than your threshold.
    </p>
  {:else if topic === "nip-17-dms"}
    <p>
      <Anchor underline external href={nip17Url}>NIP 17</Anchor> improves upon the old NIP 04 direct
      messages standard by adding support for group chats and better metadata hiding.
    </p>
    <p>
      In the past, a significant amount of information about private messages was public, event
      though the content of the messages was encrypted. This meant that anyone could find out who
      you were sending messages to, and how frequently.
    </p>
    <p>
      The new messaging standard dramatically reduces the amount of information messages leak, and
      is built on a more robust encryption standard.
    </p>
  {/if}
{:else}
  <Heading>No information on "{toTitle(topic)}"</Heading>
  <p>Sorry, we couldn't find any information on "{toTitle(topic)}".</p>
{/if}
