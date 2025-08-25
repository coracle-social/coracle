<script lang="ts">
  import {tagPubkey} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import {router} from "src/app/util/router"
  import {derived} from "svelte/store"
  import {unfollow, userFollows, follow} from "src/engine"

  export let pubkey
  export let inert = false
  export let hideActions = false
  export let hideFollowActions = false

  const following = derived(userFollows, $m => $m.has(pubkey))

  const unfollowPerson = () => unfollow(pubkey)

  const followPerson = () => follow(tagPubkey(pubkey))

  const showDetail = () => router.at("people").of(pubkey).open()

  let innerWidth = 0

  $: isSmall = innerWidth < 640
</script>

<svelte:window bind:innerWidth />

<div class="flex flex-grow flex-col gap-4">
  <div class="relative flex justify-between gap-4">
    <Button on:click={inert ? null : showDetail} class="flex gap-4 overflow-hidden">
      <PersonCircle class="h-14 w-14" {pubkey} />
      <div class="flex min-w-0 flex-grow flex-col gap-1">
        <PersonName class="text-lg" {pubkey} />
        <PersonHandle {pubkey} />
      </div>
    </Button>
    {#if !hideActions}
      <div class="flex items-start justify-end">
        <div class="flex items-center justify-end gap-2">
          {#if !hideFollowActions && !isSmall}
            {#if $following}
              <Button class="btn btn-low border-none bg-tinted-800-d" on:click={unfollowPerson}
                >Followed</Button>
            {:else}
              <Button class="btn btn-accent" on:click={followPerson}>Follow</Button>
            {/if}
          {/if}
          <slot name="actions" {pubkey}>
            <PersonActions showFollowActions={!hideFollowActions && isSmall} {pubkey} />
          </slot>
        </div>
      </div>
    {/if}
  </div>
  <PersonAbout truncate {pubkey} />
</div>
