<script lang="ts">
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {toTitle} from "src/util/misc"

  export let topic

  const topics = ["web-of-trust", "nip-17-dms", "remote-signers"]
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
  {:else if topic === "remote-signers"}
    <p>
      Nostr uses cryptographic key pairs instead of passwords to authenticate users. This means that
      you and nobody else controls your social identity - however it also requires some care to
      avoid losing your keys, or having them stolen.
    </p>
    <p>
      Instead of pasting your private key (also known as an "nsec") into every nostr app you use,
      it's wise to choose a single signer application to keep them for you.
    </p>
    <p>
      Some signers live on the internet, others can be installed on your phone or computer. If
      you're new to nostr, we recommend getting started with <Anchor
        external
        underline
        href="https://nsec.app/">nsec.app</Anchor
      >.
    </p>
    <Anchor external button tall low href="https://nostrapps.com/#Signers">
      <i class="fa fa-compass" /> Browse Signer Apps
    </Anchor>
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
