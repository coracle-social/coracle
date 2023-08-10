<script>
  import {sortBy, filter, prop} from "ramda"
  import {onMount} from "svelte"
  import {toTitle, seconds, batch} from "hurdak"
  import {now} from "src/util/misc"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {withUnwrappedEvent} from "src/engine/util/giftWrap"
  import {Nip24, pubkeyLoader, user, Network, Keys} from "src/app/engine"

  export let activeTab = "conversations"

  const {privkey} = Keys.current.get()
  const {hasNewMessages} = Nip24
  const accepted = Nip24.channels.derived(filter(prop("last_sent")))
  const requests = Nip24.channels.derived(filter(c => c.last_received && !c.last_sent))

  $: tabChannels = sortBy(
    c => -Math.max(c.last_sent || 0, c.last_received || 0),
    activeTab === "conversations" ? $accepted : $requests
  )

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "conversations" ? $accepted : $requests).length,
  })

  const setActiveTab = tab => navigate(tab === "conversations" ? "/channels" : "/channels/requests")

  document.title = "Direct Messages"

  onMount(() => {
    const pubkey = Keys.pubkey.get()
    const since = now() - seconds(90, "day")
    const sub = Network.subscribe({
      relays: user.getRelayUrls("read"),
      filter: [{kinds: [1059], "#p": [pubkey], since}],
      onEvent: batch(1000, events => {
        const pubkeys = new Set()

        for (const event of events) {
          withUnwrappedEvent(privkey, event, ({seal, rumor}) => {
            pubkeys.add(seal.pubkey)
            pubkeys.add(rumor.pubkey)
          })
        }

        console.log(pubkeys)

        pubkeyLoader.load(pubkeys)
      }),
    })

    return () => sub.close()
  })
</script>

<Content>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab} {getDisplay} />
    <Popover triggerType="mouseenter" class="absolute right-7 top-7 hidden sm:block">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-bell cursor-pointer"
          class:text-gray-5={!$hasNewMessages}
          on:click={user.markAllMessagesRead} />
      </div>
      <div slot="tooltip">Mark all as read</div>
    </Popover>
  </div>
  {#each tabChannels as channel (channel.id)}
    <ChannelsListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">No messages found.</Content>
  {/each}
</Content>
