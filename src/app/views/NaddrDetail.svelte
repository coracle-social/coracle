<script lang="ts">
  import {quantify} from "hurdak"
  import {routes} from "src/app/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {load, displayPubkey, selectHints} from "src/engine"

  export let identifier
  export let kind
  export let pubkey
  export let relays = []

  let note

  const display = displayPubkey(pubkey)

  load({
    relays: selectHints(relays),
    filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
    onEvent: event => {
      note = event
    },
  })
</script>

<Content>
  <p>
    This is a kind {kind} event called "{identifier}", published by
    <Anchor class="underline" href={routes.person(pubkey)}>@{display}</Anchor>.
  </p>
  {#if note}
    <NoteContent showEntire {note} />
  {/if}
  {#if note?.tags.length > 1}
    <p>This note has {quantify(note.tags.length - 1, "tag")}:</p>
    <ul class="list-inside list-disc">
      {#each note.tags as [type, value, ...rest]}
        {#if type !== "d"}
          <li>
            {#if type === "p"}
              <Anchor class="underline" href={routes.person(value)}>@{display}</Anchor>
            {:else if type === "e"}
              <Anchor class="underline" href={value}>Event {value}</Anchor>
            {:else}
              {type}: {value} {rest.length > 0 ? rest.join(", ") : ""}
            {/if}
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</Content>
