<script lang="ts">
  import {formatTimestamp, nth, uniq} from "@welshman/lib"
  import {
    getIdOrAddress,
    hexTags,
    isRelayUrl,
    matchTags,
    outbox,
    relays as relaySelections,
    type TrustedEvent,
  } from "@welshman/util"
  import Button from "src/partials/Button.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import {getAncestors, getAncestorTags} from "src/engine"
  import {relayLists, resolveRelays} from "src/engine/core"
  import {router} from "src/app/util"

  export let event: TrustedEvent
  export let showParent = true
  export let anchor = null

  $: ancestors = getAncestors(event)
  $: reply = ancestors.replies[0]
  $: root = ancestors.roots[0]

  $: showReply = reply && !ancestors.replies.includes(anchor) && showParent
  $: showRoot = root && !ancestors.roots.includes(anchor) && root !== reply && showParent

  const showPerson = () => router.at("people").of(event.pubkey).open()

  // Router.EventParents/EventRoots are gone. Both routed to the write relays of whoever authored
  // the ancestor (weighted heavily), then to those of anyone mentioned, then to the relay hints
  // carried on either set of tags.
  const ancestorRelays = (ancestorTags: string[][]) => {
    const mentions = matchTags(hexTags("p"), event.tags)
    const authors = ancestorTags.map(nth(3)).filter(pubkey => pubkey?.length === 64)
    const hints = uniq(
      [...ancestorTags, ...mentions].map(nth(2)).filter(url => url && isRelayUrl(url)),
    )

    return resolveRelays(
      [
        ...authors.map(pubkey => outbox(pubkey, 10)),
        ...mentions.map(nth(1)).map(pubkey => outbox(pubkey)),
        ...relaySelections(hints),
      ],
      {limit: 10},
    )
  }

  const goToDetail = () =>
    router
      .at("notes")
      // Router.Event was the author's write relays, which the relay list collection answers
      // synchronously
      .of(getIdOrAddress(event), {relays: relayLists.get().writeUrls(event.pubkey).get()})
      .push()

  const goToParent = async () =>
    router
      .at("notes")
      .of(reply, {relays: await ancestorRelays(getAncestorTags(event).replies)})
      .open()

  const goToThread = async () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: await ancestorRelays(getAncestorTags(event).roots)})
      .at("thread")
      .open()
</script>

<div class="flex gap-4">
  <div>
    <Button stopPropagation class="text-lg font-bold" on:click={showPerson}>
      <PersonCircle class="h-10 w-10" pubkey={event.pubkey} />
    </Button>
  </div>
  <div class="flex min-w-0 flex-grow flex-col gap-2">
    <div class="flex min-w-0 flex-shrink flex-col items-start justify-between sm:flex-row">
      <Button stopPropagation class="mr-4 w-full min-w-0" on:click={showPerson}>
        <PersonName pubkey={event.pubkey} />
      </Button>
      <div class="flex items-center gap-3 pt-1 text-xs sm:pt-0">
        <Button
          stopPropagation
          on:click={goToDetail}
          class="whitespace-nowrap text-end text-neutral-100">
          {formatTimestamp(event.created_at)}
        </Button>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        {#if showReply}
          <small class="text-neutral-100">
            <i class="fa fa-code-merge" />
            <Button stopPropagation class="underline" on:click={goToParent}>View Parent</Button>
          </small>
        {/if}
        {#if showRoot}
          <small class="text-neutral-100">
            <i class="fa fa-code-pull-request" />
            <Button stopPropagation class="underline" on:click={goToThread}>View Thread</Button>
          </small>
        {/if}
      </div>
    </div>
  </div>
</div>
