<script lang="ts">
  import {nthEq} from "@welshman/lib"
  import {formatTimestamp} from "@welshman/app"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import ProfileName from "@app/components/ProfileName.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import ThreadActions from "@app/components/ThreadActions.svelte"
  import {makeThreadPath} from "@app/routes"
  import {pushModal} from "@app/modal"

  export let url
  export let event
  export let hideActions = false

  const title = event.tags.find(nthEq(0, "title"))?.[1]

  const openProfile = () => pushModal(ProfileDetail, {pubkey: event.pubkey})
</script>

<Link class="col-2 card2 bg-alt w-full cursor-pointer" href={makeThreadPath(url, event.id)}>
  {#if title}
    <div class="flex w-full items-center justify-between gap-2">
      <p class="text-xl">{title}</p>
      <p class="text-sm opacity-75">
        {formatTimestamp(event.created_at)}
      </p>
    </div>
  {:else}
    <p class="-mb-3 h-0 text-end text-xs opacity-75">
      {formatTimestamp(event.created_at)}
    </p>
  {/if}
  <Content {event} expandMode="inline" quoteProps={{relays: [url]}} />
  <div class="flex w-full flex-col items-end justify-between gap-2 sm:flex-row">
    <span class="whitespace-nowrap py-1 text-sm opacity-75">
      Posted by
      <button type="button" on:click|preventDefault={openProfile} class="link-content">
        @<ProfileName pubkey={event.pubkey} />
      </button>
    </span>
    {#if !hideActions}
      <ThreadActions showActivity {url} {event} />
    {/if}
  </div>
</Link>
