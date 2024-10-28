<script lang="ts">
  import {
    pubkey,
    getRelayUrls,
    deriveRelaySelections,
    deriveInboxRelaySelections,
  } from "@welshman/app"
  import {leaveRelay, joinRelay} from "src/engine"
  import {router} from "../util"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"

  export let url
  export let details = false
  export let claim = null

  const userRelaySelections = deriveRelaySelections($pubkey)

  const userInboxRelaySelections = deriveInboxRelaySelections($pubkey)

  const join = () => joinRelay(url, claim)

  const leave = () => leaveRelay(url)

  $: userRelayUrls = [
    ...getRelayUrls($userRelaySelections),
    ...getRelayUrls($userInboxRelaySelections),
  ]
</script>

<div class="hidden gap-4 md:flex">
  <button
    class="flex items-center rounded-md bg-tinted-100-l px-6 py-1 text-sm font-bold capitalize text-tinted-700-d"
    class:bg-tinted-600-d={details}
    class:text-tinted-100-l={details}
    on:click={_ => (details = !details)}>
    INFO
  </button>
  <button
    class="flex items-center rounded-md bg-tinted-100-l px-6 py-1 text-sm font-bold capitalize text-tinted-700-d"
    on:click={() =>
      router.at(router.at("relays").of(encodeURIComponent(url)).toString()).push({modal: true})}>
    EXPLORE
  </button>
  {#if !userRelayUrls.includes(url)}
    <button
      class="flex items-center rounded-md bg-accent px-6 py-1 text-sm font-bold capitalize text-white"
      on:click={join}>
      JOIN
    </button>
  {:else if userRelayUrls.length > 1}
    <button
      class="flex items-center rounded-md bg-tinted-700-d px-6 py-1 text-sm font-bold capitalize text-neutral-100"
      on:click={leave}>
      LEAVE
    </button>
  {/if}
</div>
<Popover theme="transparent" class="flex md:hidden">
  <div
    slot="trigger"
    class="cursor-pointer rounded bg-neutral-800 px-3 py-1 text-center text-neutral-50 hover:bg-neutral-700">
    <i class="fa fa-lg fa-ellipsis-v" />
  </div>
  <div
    slot="tooltip"
    let:instance
    class="relative flex flex-col gap-2"
    on:click={() => instance.hide()}>
    <div
      class="relative z-popover flex cursor-pointer items-center justify-end text-neutral-100"
      on:click={_ => (details = !details)}>
      <span class="mr-2 whitespace-nowrap">Info</span>
      <Anchor tall button circle class="text-accent"><i class="fa fa-info text-sm" /></Anchor>
    </div>
    <div
      class="relative z-popover flex cursor-pointer items-center justify-end text-neutral-100"
      on:click={() =>
        router.at(router.at("relays").of(encodeURIComponent(url)).toString()).push({modal: true})}>
      <span class="mr-2 whitespace-nowrap">Explore</span>
      <Anchor tall button circle class="text-accent"><i class="fa fa-search text-sm" /></Anchor>
    </div>
    {#if !userRelayUrls.includes(url)}
      <div
        class="relative z-popover flex cursor-pointer items-center justify-end text-neutral-100"
        on:click={join}>
        <span class="mr-2 whitespace-nowrap">Join</span>
        <Anchor tall button circle class="text-accent"><i class="fa fa-sign-out text-sm" /></Anchor>
      </div>
    {:else if userRelayUrls.length > 1}
      <div
        class="relative z-popover flex cursor-pointer items-center justify-end text-neutral-100"
        on:click={leave}>
        <span class="mr-2 whitespace-nowrap">Leave</span>
        <Anchor tall button circle class="text-accent"><i class="fa fa-sign-out text-sm" /></Anchor>
      </div>
    {/if}
    <div
      class="absolute bottom-0 right-0 top-0 w-32 rounded-3xl bg-neutral-800"
      style="filter: blur(15px)" />
  </div>
</Popover>
