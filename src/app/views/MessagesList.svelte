<script>
  import {sortBy, filter, complement, pluck, prop} from "ramda"
  import {onMount} from "svelte"
  import {toTitle} from "hurdak/lib/hurdak"
  import {now, batch, timedelta} from "src/util/misc"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {Nip04, PubkeyLoader, User, Network, Keys} from "src/app/engine"

  export let activeTab = "messages"

  const {hasNewMessages} = Nip04
  const contacts = Nip04.contacts.derived(sortBy(c => -(c.last_sent || c.last_received)))
  const accepted = contacts.derived(filter(prop("last_sent")))
  const requests = contacts.derived(filter(complement(prop("last_sent"))))

  $: tabContacts = activeTab === "messages" ? $accepted : $requests

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "messages" ? $accepted : $requests).length,
  })

  document.title = "Direct Messages"

  onMount(() => {
    const pubkey = Keys.pubkey.get()
    const since = now() - timedelta(90, "days")
    const sub = Network.subscribe({
      relays: User.getRelayUrls("read"),
      filter: [
        {kinds: [4], authors: [pubkey], since},
        {kinds: [4], "#p": [pubkey], since},
      ],
      onEvent: batch(1000, events => {
        PubkeyLoader.load(pluck("pubkey", events))
      }),
    })

    return () => sub.close()
  })
</script>

<Content>
  <div class="relative">
    <Tabs tabs={["messages", "requests"]} {activeTab} setActiveTab={navigate} {getDisplay} />
    <Popover triggerType="mouseenter" class="absolute right-7 top-7">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-bell cursor-pointer"
          class:text-gray-5={!$hasNewMessages}
          on:click={User.markAllMessagesRead} />
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
