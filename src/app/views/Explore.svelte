<script lang="ts">
  import {onMount} from "svelte"
  import {identity, sortBy} from "ramda"
  import {quantify} from "hurdak"
  import {Tags} from "paravel"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {router} from "src/app/router"
  import {
    labels,
    session,
    follows,
    subscribe,
    getPubkeyHints,
    getPubkeysWithDefaults,
  } from "src/engine"

  const labelGroups = labels.throttle(1000).derived($labels => {
    const $labelGroups = {}

    for (const e of $labels) {
      const tags = Tags.from(e)

      if (tags.type("e").count() === 0) {
        continue
      }

      for (const label of tags.type("l").mark(["#t", "ugc"]).values().all()) {
        $labelGroups[label] = $labelGroups[label] || {
          label,
          authors: new Set(),
          relays: new Set(),
          size: 0,
        }

        const group = $labelGroups[label]

        group.authors.add(e.pubkey)

        for (const [id, hint] of tags.type("e").drop(1).all()) {
          group.size += 1

          if (hint) {
            group.relays.add(hint)
          }

          if (e.created_at > (group.feature?.created_at || 0)) {
            group.feature = {id, created_at: e.created_at}
          }
        }
      }
    }

    // @ts-ignore
    return sortBy(({authors, size}) => -(authors.size * size), Object.values($labelGroups))
  })

  const showGroup = ({label, relays}) =>
    router
      .at("labels")
      .of(label)
      .qp({relays: Array.from(relays)})
      .open()

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
    {@const {label, authors, size, feature, relays} = group}
    <Card>
      <div class="flex items-start justify-between">
        <div class="flex gap-2">
          <i class="fa fa-xl fa-tag my-8 ml-4" />
          <Heading>{label}</Heading>
        </div>
        <Anchor class="mt-4" button accent on:click={() => showGroup(group)}
          >See more</Anchor>
      </div>
      <Content>
        <div class="flex gap-2">
          <p class="py-1">{quantify(size, "note")}, curated by</p>
          {#each Array.from(authors) as pubkey (pubkey)}
            <Chip class="mb-1 mr-1">
              <PersonBadgeSmall {pubkey} />
            </Chip>
          {/each}
        </div>
        <Note note={{id: feature.id}} relays={Array.from(relays)} />
      </Content>
    </Card>
  {/each}
</Content>
