<script>
  import {sortBy, filter, complement, pluck, prop} from "ramda"
  import {onMount} from "svelte"
  import {toTitle, seconds, batch} from "hurdak"
  import {now} from "src/util/misc"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {getUserRelayUrls} from "src/engine2"
  import {Nip04, pubkeyLoader, user, Network, Keys} from "src/app/engine"

  export let activeTab = "conversations"

  const {hasNewMessages} = Nip04
  const accepted = Nip04.contacts.derived(filter(prop("last_sent")))
  const requests = Nip04.contacts.derived(filter(complement(prop("last_sent"))))

  $: tabContacts = sortBy(
    c => -Math.max(c.last_sent || 0, c.last_received || 0),
    activeTab === "conversations" ? $accepted : $requests
  )

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "conversations" ? $accepted : $requests).length,
  })

  document.title = "Direct Messages"

  onMount(() => {
    const pubkey = Keys.pubkey.get()
    const since = now() - seconds(90, "day")
    const sub = Network.subscribe({
      relays: getUserRelayUrls("read"),
      filter: [
        {kinds: [4], authors: [pubkey], since},
        {kinds: [4], "#p": [pubkey], since},
      ],
      onEvent: batch(1000, events => {
        pubkeyLoader.load(pluck("pubkey", events))
      }),
    })

    return () => sub.close()
  })
</script>

<Content>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} setActiveTab={navigate} {getDisplay} />
    <Popover triggerType="mouseenter" class="absolute right-7 top-7 hidden sm:block">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-pointer"
          class:text-gray-5={!$hasNewMessages}
          on:click={user.markAllMessagesRead} />
      </div>
      <div slot="tooltip">Mark all as read</div>
    </Popover>
  </div>
  {#each tabContacts as contact (contact.pubkey)}
    <MessagesListItem {contact} />
  {:else}
    <Content size="lg" class="text-center">
      No messages found - start a conversation by clicking the envelope button on someone's profile.
    </Content>
  {/each}
</Content>
