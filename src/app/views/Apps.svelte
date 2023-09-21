<script lang="ts">
  import {nip05} from "nostr-tools"
  import {uniqBy, sortBy} from "ramda"
  import {batch, quantify} from "hurdak"
  import {tryJson, displayDomain, pushToKey} from "src/util/misc"
  import {copyToClipboard} from "src/util/html"
  import {Tags} from "src/util/nostr"
  import {fly} from "src/util/transition"
  import {toast, modal} from "src/partials/state"
  import Image from "src/partials/Image.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import type {Person, Event} from "src/engine"
  import {
    getUserRelayUrls,
    compileFilter,
    loadPubkeys,
    load,
    displayHandle,
    derivePerson,
  } from "src/engine"

  const getColumns = xs => {
    const cols = [[], []]

    xs.forEach((x, i) => {
      cols[i % 2].push(x)
    })

    return cols.flatMap(x => x)
  }

  const copy = (label, value) => {
    copyToClipboard(value)
    toast.show("info", `${label} copied to clipboard!`)
  }

  const goToNip05 = async entity => {
    const profile = await nip05.queryProfile(entity)

    if (profile) {
      modal.push({type: "person/detail", pubkey: profile.pubkey})
    } else {
      copy("Address", entity)
    }
  }

  load({
    filters: [{kinds: [31990]}, compileFilter({kinds: [31989], authors: "follows"})],
    relays: getUserRelayUrls("read"),
    onEvent: batch(500, events => {
      const pubkeys = []

      for (const e of events) {
        pubkeys.push(e.pubkey)

        if (e.kind === 31990) {
          ;(e as any).address = [e.kind, e.pubkey, Tags.from(e).getMeta("d")].join(":")

          handlers = handlers.concat(e)
        } else {
          for (const a of Tags.from(e).type("a").values().all()) {
            recsByNaddr = pushToKey(recsByNaddr, a, e)
          }
        }
      }

      loadPubkeys(pubkeys)
    }),
  })

  let handlers = []
  let recsByNaddr = {}

  type App = Event & {
    address: string
    recs: Event[]
    profile: Person["profile"]
    handle: Person["handle"]
  }

  $: apps = uniqBy(
    (e: App) => e.profile?.name,
    sortBy(
      e => -e.recs.length,
      handlers.map(e => {
        const $person = derivePerson(e.pubkey).get()

        e.recs = recsByNaddr[e.address] || []
        e.profile = tryJson(() => JSON.parse(e.content)) || $person?.profile
        e.handle = $person?.handle

        return e as App
      })
    )
  )

  document.title = "Apps"
</script>

<div in:fly={{y: 20}}>
  <div class="flex flex-col gap-12 p-4">
    <div class="flex flex-col items-center justify-center">
      <Heading>Recommended micro-apps</Heading>
      <p>Hand-picked recommendations to enhance your nostr experience.</p>
    </div>
    <div class="columns-sm gap-4">
      {#each getColumns(apps) as app (app.id)}
        <Card class="mb-4 flex break-inside-avoid flex-col gap-4">
          <div class="flex gap-4">
            <ImageCircle size={14} src={app.profile.picture} />
            <div class="flex min-w-0 flex-grow flex-col">
              <h1 class="text-2xl">{app.profile.display_name || app.profile.name}</h1>
              {#if app.handle}
                <span class="text-gray-3">{displayHandle(app.handle)}</span>
              {/if}
            </div>
          </div>
          <p>{app.profile.about}</p>
          <div>
            {#if app.profile.website}
              <Anchor external href={app.profile.website} class="mb-2 mr-2 inline-block">
                <Chip><i class="fa fa-link" />{displayDomain(app.profile.website)}</Chip>
              </Anchor>
            {/if}
            {#if app.profile.lud16}
              <div class="mb-2 mr-2 inline-block cursor-pointer">
                <Chip on:click={() => copy("Address", app.profile.lud16)}>
                  <i class="fa fa-bolt" />{app.profile.lud16}
                </Chip>
              </div>
            {/if}
            {#if app.profile.nip05}
              <div class="mb-2 mr-2 inline-block cursor-pointer">
                <Chip on:click={() => goToNip05(app.profile.nip05)}>
                  <i class="fa fa-at" />{app.profile.nip05}
                </Chip>
              </div>
            {/if}
          </div>
          {#if app.recs.length > 0}
            <i class="text-sm">
              Recommended by {quantify(app.recs.length, "person", "people")} you follow.
            </i>
          {/if}
          {#if app.profile.banner}
            <Image class="rounded" src={app.profile.banner} />
          {/if}
        </Card>
      {/each}
    </div>
  </div>
</div>
