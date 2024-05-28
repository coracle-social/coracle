<script lang="ts">
  import {ellipsize} from "hurdak"
  import {parseContent} from "src/util/notes"
  import {displayUrl} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import {displayProfile} from "src/domain"
  import {getProfile, deriveProfile} from "src/engine"

  export let pubkey
  export let truncate = false

  const profile = deriveProfile(pubkey)

  $: about = $profile?.about || ""
  $: content = parseContent({content: truncate ? ellipsize(about, 140) : about})
</script>

<p>
  {#each content as { type, value }}
    {#if type === "newline"}
      {#each value as line}
        <br />
      {/each}
    {:else if type === "link"}
      <Anchor class="underline" external href={value.url}>
        {displayUrl(value.url)}
      </Anchor>
    {:else if type.startsWith("nostr:")}
      <Anchor modal class="underline" href={value.entity}>
        {#if value.pubkey}
          {displayProfile(getProfile(value.pubkey))}
        {:else if value.id}
          event {value.id}
        {:else}
          {value.entity.slice(0, 10) + "..."}
        {/if}
      </Anchor>
    {:else}
      {value}
    {/if}
  {/each}
</p>
