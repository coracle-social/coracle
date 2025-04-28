<script lang="ts">
  import {getAncestors, getIdOrAddress, type TrustedEvent} from "@welshman/util"
  import {Router} from "@welshman/router"
  import Anchor from "src/partials/Anchor.svelte"
  import {formatTimestamp} from "src/util/misc"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
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

  const goToDetail = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: Router.get().Event(event).getUrls()})
      .push()

  const goToParent = () =>
    router
      .at("notes")
      .of(reply, {relays: Router.get().EventParents(event).getUrls()})
      .open()

  const goToThread = () =>
    router
      .at("notes")
      .of(getIdOrAddress(event), {relays: Router.get().EventRoots(event).getUrls()})
      .at("thread")
      .open()
</script>

<div class="flex gap-4">
  <div>
    <Anchor class="text-lg font-bold" on:click={showPerson}>
      <PersonCircle class="h-10 w-10" pubkey={event.pubkey} />
    </Anchor>
  </div>
  <div class="flex min-w-0 flex-grow flex-col gap-2">
    <div class="flex min-w-0 flex-shrink flex-col items-start justify-between sm:flex-row">
      <Anchor type="unstyled" class="mr-4 w-full min-w-0" on:click={showPerson}>
        <PersonName pubkey={event.pubkey} />
      </Anchor>
      <div class="flex items-center gap-3 pt-1 text-xs sm:pt-0">
        <Anchor
          on:click={goToDetail}
          class="whitespace-nowrap text-end text-neutral-100"
          type="unstyled">
          {formatTimestamp(event.created_at)}
        </Anchor>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        {#if showReply}
          <small class="text-neutral-100">
            <i class="fa fa-code-merge" />
            <Anchor underline on:click={goToParent}>View Parent</Anchor>
          </small>
        {/if}
        {#if showRoot}
          <small class="text-neutral-100">
            <i class="fa fa-code-pull-request" />
            <Anchor underline on:click={goToThread}>View Thread</Anchor>
          </small>
        {/if}
      </div>
    </div>
  </div>
</div>
