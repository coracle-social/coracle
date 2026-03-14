<script lang="ts">
  import {_} from "svelte-i18n"
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Link from "src/partials/Link.svelte"
  import {toTitle} from "src/util/misc"

  export let topic

  const topics = ["web-of-trust", "nip-17-dms", "remote-signers"]
  const nip17Url = "https://github.com/nostr-protocol/nips/blob/master/17.md"
</script>

{#if topics.includes(topic)}
  <Heading>{toTitle(topic)}</Heading>
  {#if topic === "web-of-trust"}
    <p>
      {$_("help.wotDescription1")}
    </p>
    <p>
      {$_("help.wotDescription2", {values: {appName}})}
    </p>
    <p>
      {$_("help.wotDescription3")}
    </p>
  {:else if topic === "remote-signers"}
    <p>
      {$_("help.signerDescription1")}
    </p>
    <p>
      {$_("help.signerDescription2")}
    </p>
    <p>
      {$_("help.signerDescription3")} <Link
        external
        class="underline"
        href="https://nsec.app/">nsec.app</Link
      >.
    </p>
    <Link external class="btn btn-tall btn-low" href="https://nostrapps.com/#signers">
      <i class="fa fa-compass" /> {$_("help.browseSignerApps")}
    </Link>
  {:else if topic === "nip-17-dms"}
    <p>
      <Link class="underline" external href={nip17Url}>NIP 17</Link> {$_("help.dmDescription1")}
    </p>
    <p>
      {$_("help.dmDescription2")}
    </p>
    <p>
      {$_("help.dmDescription3")}
    </p>
  {/if}
{:else}
  <Heading>{$_("help.noInfo", {values: {topic: toTitle(topic)}})}</Heading>
  <p>{$_("help.notFound", {values: {topic: toTitle(topic)}})}</p>
{/if}
