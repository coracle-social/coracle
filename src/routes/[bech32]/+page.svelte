<script lang="ts">
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import type {TrustedEvent} from "@welshman/util"
  import {Address, getIdFilters, getTagValue} from "@welshman/util"
  import {load} from "@welshman/net"
  import {page} from "$app/stores"
  import {goto} from "$app/navigation"
  import {scrollToEvent} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import {makeRoomPath, makeThreadPath} from "@app/routes"

  const {bech32} = $page.params

  const attemptToNavigate = async () => {
    const {type, data} = nip19.decode(bech32) as any

    if (!["nevent", "naddr"].includes(type) && data.relays.length > 0) {
      return goto("/", {replaceState: true})
    }

    let found = false

    load({
      relays: data.relays,
      filters: getIdFilters([type === "nevent" ? data.id : Address.fromNaddr(bech32).toString()]),
      onEvent: (event: TrustedEvent) => {
        found = true

        if (event.kind === 9) {
          goto(makeRoomPath(data.relays[0], getTagValue("h", event.tags)!), {replaceState: true})
          scrollToEvent(event.id)
        } else if (event.kind === 11) {
          goto(makeThreadPath(data.relays[0], event.id), {replaceState: true})
        } else {
          goto("/", {replaceState: true})
        }
      },
      onClose: () => {
        if (!found) {
          goto("/", {replaceState: true})
        }
      },
    })
  }

  onMount(async () => {
    try {
      await attemptToNavigate()
    } catch (e) {
      goto("/", {replaceState: true})
    }
  })
</script>

<Spinner />
