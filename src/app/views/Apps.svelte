<script>
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
  import {Network, Directory, Nip05, user, pubkeyLoader} from "src/app/engine"
  import {compileFilter} from "src/app/state"

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

  Network.subscribe({
    timeout: 5000,
    filter: [{kinds: [31990]}, compileFilter({kinds: [31989], authors: "follows"})],
    relays: user.getRelayUrls("read"),
    onEvent: batch(500, events => {
      const pubkeys = []

      for (const e of events) {
        pubkeys.push(e.pubkey)

        if (e.kind === 31990) {
          e.address = [e.kind, e.pubkey, Tags.from(e).getMeta("d")].join(":")

          handlers = handlers.concat(e)
        } else {
          for (const a of Tags.from(e).type("a").values().all()) {
            recsByNaddr = pushToKey(recsByNaddr, a, e)
          }
        }
      }

      pubkeyLoader.load(pubkeys)
    }),
  })

  let handlers = []
  let recsByNaddr = {}

  $: apps = uniqBy(
    e => e.info.name,
    sortBy(
      e => -e.recs.length,
      handlers.map(e => {
        e.recs = recsByNaddr[e.address] || []
        e.info = tryJson(() => JSON.parse(e.content)) || Directory.getProfile(e.pubkey)
        e.handle = Nip05.getHandle(e.pubkey)

        return e
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
            <ImageCircle size={14} src={app.info.picture} />
            <div class="flex min-w-0 flex-grow flex-col">
              <h1 class="text-2xl">{app.info.display_name || app.info.name}</h1>
              {#if app.handle}
                <span class="text-gray-3">{Nip05.displayHandle(app.handle)}</span>
              {/if}
            </div>
          </div>
          <p>{app.info.about}</p>
          <div>
            {#if app.info.website}
              <Anchor external href={app.info.website} class="mb-2 mr-2 inline-block">
                <Chip><i class="fa fa-link" />{displayDomain(app.info.website)}</Chip>
              </Anchor>
            {/if}
            {#if app.info.lud16}
              <div class="mb-2 mr-2 inline-block cursor-pointer">
                <Chip on:click={() => copy("Address", app.info.lud16)}>
                  <i class="fa fa-bolt" />{app.info.lud16}
                </Chip>
              </div>
            {/if}
            {#if app.info.nip05}
              <div class="mb-2 mr-2 inline-block cursor-pointer">
                <Chip on:click={() => goToNip05(app.info.nip05)}>
                  <i class="fa fa-at" />{app.info.nip05}
                </Chip>
              </div>
            {/if}
          </div>
          {#if app.recs.length > 0}
            <i class="text-sm">
              Recommended by {quantify(app.recs.length, "person", "people")} you follow.
            </i>
          {/if}
          {#if app.info.banner}
            <Image class="rounded" src={app.info.banner} />
          {/if}
        </Card>
      {/each}
    </div>
  </div>
</div>
