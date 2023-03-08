<script>
  import {sortBy} from "ramda"
  import {toTitle} from "hurdak/lib/hurdak"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/views/messages/MessagesListItem.svelte"
  import database from "src/agent/database"

  let activeTab = "messages"

  const setActiveTab = tab => {
    activeTab = tab
  }

  const accepted = database.watch("contacts", t => t.all({accepted: true}))
  const requests = database.watch("contacts", t => t.all({"accepted:!eq": true}))

  const getContacts = tab => sortBy(c => -c.lastMessage, tab === "messages" ? $accepted : $requests)

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
  {/each}
</Content>
