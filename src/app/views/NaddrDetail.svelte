<script>
  import {onMount} from "svelte"
  import {quantify} from "hurdak"
  import {routes} from "src/app/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {Directory, Settings, Nip65, Network} from "src/app/engine"

  export let identifier
  export let kind
  export let pubkey
  export let relays = []

  let note

  const display = Directory.displayPubkey(pubkey)

  onMount(async () => {
    const sub = Network.subscribe({
      timeout: 30_000,
      relays: Nip65.selectHints(Settings.getSetting("relay_limit"), relays),
      filter: {kinds: [kind], authors: [pubkey], "#d": [identifier]},
      onEvent: event => {
        note = event
      },
    })

    return () => sub.close()
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
  {/if}
</Content>
