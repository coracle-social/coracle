<script lang="ts">
  import {ellipsize} from "hurdak"
  import {parseContent} from "src/util/notes"
  import Anchor from "src/partials/Anchor.svelte"
  import {groups, displayGroup} from "src/engine"

  export let address
  export let truncate = false

  const group = groups.key(address)

  $: about = $group?.description || ""
  $: content = parseContent({content: truncate ? ellipsize(about, 140) : about})
</script>

<p>
  {#each content as { type, value }}
    {#if type === "newline"}
      {#each value as _}
        <br />
      {/each}
    {:else if type === "link"}
      <Anchor class="underline" external href={value.url}>
        {value.url.replace(/https?:\/\/(www\.)?/, "")}
      </Anchor>
    {:else if type.startsWith("nostr:")}
      <Anchor class="underline" external href={"/" + value.entity}>
        {#if value.pubkey}
          {displayGroup($group)}
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
