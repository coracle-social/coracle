<script>
  import {onMount} from "svelte"
  import {first, quantify} from "hurdak/lib/hurdak"
  import {routes} from "src/app/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {directory, routing} from "src/system"
  import network from "src/agent/network"

  export let identifier
  export let kind
  export let pubkey
  export let relays = []

  let note
  let loading = true

  const display = directory.displayPubkey(pubkey)

  onMount(async () => {
    note = first(
      await network.load({
        relays: routing.selectHints(3, relays),
        filter: {kinds: [kind], pubkey, "#d": [identifier]},
      })
    )

    loading = false
  })
</script>

<Content size="lg">
  <p>
    This is a kind {kind} event called "{identifier}", published by
    <Anchor class="underline" href={routes.person(pubkey)}>@{display}</Anchor>.
  </p>
  {#if note?.content}
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
  {:else if loading}
    <Spinner />
  {/if}
</Content>
