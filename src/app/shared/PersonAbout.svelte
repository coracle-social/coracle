<script lang="ts">
  import {ellipsize} from "hurdak/lib/hurdak"
  import {displayPerson} from "src/util/nostr"
  import {parseContent} from "src/util/notes"
  import Anchor from "src/partials/Anchor.svelte"
  import {getPersonWithFallback} from "src/agent/db"

  export let person
  export let truncate = false

  const about = person?.kind0?.about || ""
  const content = parseContent({content: truncate ? ellipsize(about, 140) : about})
</script>

<p class="overflow-hidden text-ellipsis">
  {#each content as { type, value }}
    {#if type === "newline"}
      {#each value as _}
        <br />
      {/each}
    {:else if type === "link"}
      <Anchor external href={value}>
        {value.replace(/https?:\/\/(www\.)?/, "")}
      </Anchor>
    {:else if type.startsWith("nostr:")}
      <Anchor external href={"/" + value.entity}>
        {#if value.pubkey}
          {displayPerson(getPersonWithFallback(value.pubkey))}
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
