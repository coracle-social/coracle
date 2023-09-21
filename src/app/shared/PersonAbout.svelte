<script lang="ts">
  import {ellipsize} from "hurdak"
  import {parseContent} from "src/util/notes"
  import Anchor from "src/partials/Anchor.svelte"
  import {displayPerson, derivePerson} from "src/engine"

  export let pubkey
  export let truncate = false

  const person = derivePerson(pubkey)
  const about = $person.profile?.about || ""
  const content = parseContent({content: truncate ? ellipsize(about, 140) : about})
</script>

<p>
  {#each content as { type, value }}
    {#if type === "newline"}
      {" "}
    {:else if type === "link"}
      <Anchor class="underline" external href={value.url}>
        {value.url.replace(/https?:\/\/(www\.)?/, "")}
      </Anchor>
    {:else if type.startsWith("nostr:")}
      <Anchor class="underline" external href={"/" + value.entity}>
        {#if value.pubkey}
          {displayPerson($person)}
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
