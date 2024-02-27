<script lang="ts">
  import {Tags} from "paravel"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {groupRequests, loadPubkeys} from "src/engine"
  import {router} from "src/app/router"

  export let address
  export let request
  export let showGroup = false

  const claim = Tags.fromEvent(request).get("claim").value()
  const dismiss = () => groupRequests.key(request.id).merge({resolved: true})

  const resolve = () => {
    if (request.kind === 25) {
      router
        .at("groups")
        .of(address)
        .at("rotate")
        .qp({addMembers: [request.pubkey]})
        .open()
    }

    if (request.kind === 26) {
      router
        .at("groups")
        .of(address)
        .at("rotate")
        .qp({removeMembers: [request.pubkey]})
        .open()
    }
  }

  loadPubkeys([request.pubkey])
</script>

<Card interactive>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <p class="text-xl">
        {#if request.kind === 25}
          Request to join
        {:else if request.kind === 26}
          Key rotation request
        {/if}
      </p>
      <div class="hidden gap-2 sm:flex">
        <Anchor on:click={dismiss} button>Dismiss</Anchor>
        <Anchor on:click={resolve} button accent>Resolve</Anchor>
      </div>
    </div>
    <p class="border-l-2 border-solid border-neutral-600 pl-2">
      "{request.content}"
    </p>
    <p>
      Resolving this request will
      {#if request.kind === 25}
        add <Chip class="relative top-px mx-1"><PersonBadgeSmall pubkey={request.pubkey} /></Chip> to
      {:else if request.kind === 26}
        remove <Chip class="relative top-px mx-1"
          ><PersonBadgeSmall pubkey={request.pubkey} /></Chip> from
      {/if}
      {#if showGroup}
        <Anchor modal href={router.at("groups").of(address).at("notes").toString()}>
          <Chip class="relative top-px mx-1">
            <GroupCircle {address} class="h-4 w-4" />
            <GroupName {address} />
          </Chip>
        </Anchor>
      {:else}
        the group.
      {/if}
    </p>
    {#if claim}
      <p>Claim: "{claim}"</p>
    {/if}
    <div class="flex gap-2 sm:hidden">
      <Anchor on:click={dismiss} button>Dismiss</Anchor>
      <Anchor on:click={resolve} button accent>Resolve</Anchor>
    </div>
  </FlexColumn>
</Card>
