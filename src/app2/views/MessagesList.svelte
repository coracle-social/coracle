<script>
  import {sortBy} from "ramda"
  import {toTitle} from "hurdak/lib/hurdak"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app2/views/MessagesListItem.svelte"
  import {watch} from "src/agent/storage"

  let activeTab = "messages"
  let contacts = []

  const getContacts = tab => sortBy(c => -c.lastMessage, tab === "messages" ? $accepted : $requests)

  $: contacts = getContacts(activeTab)

  const setActiveTab = tab => {
    activeTab = tab
  }

  const accepted = watch("contacts", t => sortBy(e => -e.lastMessage, t.all({accepted: true})))
  const requests = watch("contacts", t =>
    sortBy(e => -e.lastMessage, t.all({"accepted:!eq": true}))
  )

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: getContacts(tab).length,
  })

  document.title = "Direct Messages"
</script>

<Content>
  <Tabs tabs={["messages", "requests"]} {activeTab} {setActiveTab} {getDisplay} />
  {#each getContacts(activeTab) as contact (contact.pubkey)}
    <MessagesListItem {contact} />
  {:else}
    <Content size="lg" class="text-center">
      No messages found - start a conversation by clicking the envelope button on someone's profile.
    </Content>
  {/each}
</Content>
