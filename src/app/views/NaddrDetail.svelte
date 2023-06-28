<script>
  import {onMount} from "svelte"
  import {first, quantify} from "hurdak/lib/hurdak"
  import {displayPerson} from "src/util/nostr"
  import {routes} from "src/app/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import network from "src/agent/network"
  import {sampleRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"

  export let identifier
  export let kind
  export let pubkey
  export let relays = []

  let note
  let loading = true

  onMount(async () => {
    note = first(
      await network.load({
        relays: sampleRelays(relays),
        filter: {kinds: [kind], pubkey, "#d": [identifier]},
      })
    )

    loading = false
  })
</script>

<Content size="lg">
  <p>
    This is a kind {kind} event called "{identifier}", published by
    <Anchor class="underline" href={routes.person(pubkey)}
      >@{displayPerson(getPersonWithFallback(pubkey))}</Anchor
    >.
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
              <Anchor class="underline" href={routes.person(value)}
                >@{displayPerson(getPersonWithFallback(value))}</Anchor>
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
