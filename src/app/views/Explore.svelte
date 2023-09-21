<script lang="ts">
  import {onMount} from "svelte"
  import {map, identity, sortBy} from "ramda"
  import {quantify} from "hurdak"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {
    labels,
    session,
    follows,
    subscribe,
    getPubkeyHints,
    getPubkeysWithDefaults,
  } from "src/engine"

  type LabelGroup = {
    label: string
    ids: string[]
    hints: string[]
    authors: string[]
  }

  const labelGroups = labels.derived($labels => {
    const $labelGroups = {}

    for (const e of $labels) {
      const tags = Tags.from(e)

      if (tags.type("e").count() === 0) {
        continue
      }

      for (const label of tags.type("l").mark(["#t", "ugc"]).values().all()) {
        $labelGroups[label] = $labelGroups[label] || {
          authors: new Set(),
          hints: new Set(),
          ids: new Set(),
        }

        $labelGroups[label].authors.add(e.pubkey)

        for (const [id, hint] of tags.type("e").drop(1).all()) {
          $labelGroups[label].ids.add(id)

          if (hint) {
            $labelGroups[label].hints.add(hint)
          }
        }
      }
    }

    return sortBy(
      ({authors, ids}) => -(authors.length * ids.length),
      Object.entries($labelGroups).map(
        ([label, group]) => ({label, ...map(Array.from, group as any)} as LabelGroup)
      )
    )
  })

  const showGroup = ({label, ids, hints}) => modal.push({type: "label/detail", label, ids, hints})

  onMount(() => {
    const sub = subscribe({
      relays: getPubkeyHints($session?.pubkey, "read"),
      filters: [
        {
          kinds: [1985],
          "#L": ["#t", "ugc"],
          authors: getPubkeysWithDefaults($follows).concat($session?.pubkey).filter(identity),
        },
      ],
    })

    return () => sub.close()
  })

  document.title = "Explore"
</script>

<Content>
  {#each $labelGroups as group (group.label)}
    {@const {label, authors, ids, hints} = group}
    <Card>
      <div class="flex items-start justify-between">
        <div class="flex gap-2">
          <i class="fa fa-xl fa-tag my-8 ml-4" />
          <Heading>{label}</Heading>
        </div>
        <Anchor class="mt-4" theme="button-accent" on:click={() => showGroup(group)}
          >See more</Anchor>
      </div>
      <Content>
        <div class="flex gap-2">
          <p class="py-1">{quantify(ids.length, "note")}, curated by</p>
          {#each authors as pubkey (pubkey)}
            <Chip class="mb-1 mr-1">
              <PersonBadgeSmall {pubkey} />
            </Chip>
          {/each}
        </div>
        <Note note={{id: ids[0]}} invertColors relays={hints} />
      </Content>
    </Card>
  {/each}
</Content>
