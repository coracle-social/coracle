<script>
  import {sortBy} from "ramda"
  import {toTitle} from "hurdak/lib/hurdak"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {watch} from "src/agent/db"

  export let activeTab = "messages"

  const accepted = watch("contacts", t => t.all({lastSent: {$exists: true}}))
  const requests = watch("contacts", t => t.all({lastSent: {$exists: false}}))

  const getContacts = tab =>
    sortBy(c => -(c.lastSent || c.lastReceived || 0), tab === "messages" ? $accepted : $requests)

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: getContacts(tab).length,
  })

  document.title = "Direct Messages"
</script>

<Content>
  <Tabs tabs={["messages", "requests"]} {activeTab} setActiveTab={navigate} {getDisplay} />
  {#each getContacts(activeTab) as contact (contact.pubkey)}
    <MessagesListItem {contact} />
  {:else}
    <Content size="lg" class="text-center">
      No messages found - start a conversation by clicking the envelope button on someone's profile.
    </Content>
  {/each}
</Content>
