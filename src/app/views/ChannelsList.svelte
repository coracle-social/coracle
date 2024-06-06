<script lang="ts">
  import {onMount} from "svelte"
  import {filter} from "ramda"
  import {toTitle, Storage} from "hurdak"
  import {derived, readable} from "svelte/store"
  import {slide} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/util/router"
  import type {Channel} from "src/engine"
  import {
    nip44,
    pubkey,
    canSign,
    channels,
    hasNewMessages,
    sortChannels,
    markAllChannelsRead,
    loadLegacyMessages,
    loadGiftWraps,
  } from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const userChannels = channels.derived(filter((c: Channel) => c.members?.includes($pubkey)))
  const accepted = userChannels.derived(filter((c: Channel) => Boolean(c.last_sent)))
  const requests = userChannels.derived(filter((c: Channel) => c.last_received && !c.last_sent))
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  const loadMore = async () => {
    limit += 20
  }

  const hideAlert = () => {
    Storage.setJson("hide_nip04_alert", true)
    hideNip04Alert = true
  }

  const loadMessages = ({reload = false} = {}) => {
    loaders.map(loader => loader.stop())
    loaders = [loadGiftWraps({reload}), loadLegacyMessages({reload})]

    loading = derived(
      loaders.map(l => l.loading),
      loading => loading.every(v => v === true),
    )
  }

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  let limit = 20
  let element
  let loaders = []
  let loading = readable(false)
  let hideNip04Alert = Storage.getJson("hide_nip04_alert")

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    // Don't load if we just switched tabs
    if (!router.history.get()[1]?.path.startsWith("/channels")) {
      loadMessages()
    }

    return () => {
      scroller.stop()
      loaders.map(loader => loader.stop())
    }
  })

  document.title = "Direct Messages"
</script>

<FlexColumn bind:element>
  {#if $nip44.isEnabled() && !hideNip04Alert}
    <div class="-my-2">
      <div out:slide|local class="py-4">
        <Card class="relative">
          <FlexColumn>
            <p class="flex items-center gap-4 text-xl">
              <i class="fa fa-info-circle" /> You’re using a new version of private messages.
            </p>
            <p>
              Nostr messages are now more secure, but are still far from perfect. For truly private
              communication, consider using <Anchor external underline href="https://simplex.chat"
                >SimpleX</Anchor> instead.
            </p>
          </FlexColumn>
          <i class="fa fa-times absolute right-0 top-0 cursor-pointer p-2" on:click={hideAlert} />
        </Card>
      </div>
    </div>
  {/if}
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-comments fa-lg" />
      <h2 class="staatliches text-2xl">Your conversations</h2>
    </div>
    <Anchor modal button accent href="/channels/create" disabled={!$canSign}>
      <i class="fa-solid fa-plus" /> Create
    </Anchor>
  </div>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2">
        <div>{toTitle(tab)}</div>
        <div class="h-6 rounded-full bg-neutral-700 px-2">
          {(tab === "conversations" ? $accepted : $requests).length}
        </div>
      </div>
    </Tabs>
    <div class="absolute right-5 top-1 hidden items-center gap-6 sm:flex">
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <i
            class="fa fa-arrows-rotate cursor-pointer text-neutral-600"
            class:fa-spin={$loading}
            on:click={() => loadMessages({reload: true})} />
        </div>
        <div slot="tooltip">
          {#if $loading}
            Loading conversations...
          {:else}
            Reload conversations
          {/if}
        </div>
      </Popover>
      <Popover triggerType="mouseenter">
        <div slot="trigger">
          <i
            class="fa fa-bell cursor-pointer"
            class:text-neutral-600={!$hasNewMessages}
            on:click={markAllChannelsRead} />
        </div>
        <div slot="tooltip">Mark all as read</div>
      </Popover>
    </div>
  </div>
  {#each tabChannels.slice(0, limit) as channel (channel.id)}
    <ChannelsListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">No messages found.</Content>
  {/each}
</FlexColumn>
