<script lang="ts">
  import {onMount} from "svelte"
  import {ctx, ago} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ChatItem from "@app/components/ChatItem.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import {chatSearch, pullConservatively} from "@app/state"
  import {pushModal} from "@app/modal"

  let term = ""

  const startChat = () => pushModal(ChatStart)

  $: chats = $chatSearch.searchOptions(term).filter(c => c.pubkeys.length > 1)

  onMount(() => {
    const filter = {kinds: [WRAP], "#p": [$pubkey!]}
    const sub = subscribe({filters: [{...filter, since: ago(30)}]})

    pullConservatively({
      filters: [filter],
      relays: ctx.app.router.InboxRelays().getUrls(),
    })

    return () => sub.close()
  })
</script>

<div class="hidden min-h-screen md:hero">
  <div class="col-2 hero-content text-center">
    <p class="row-2 text-lg">
      <Icon icon="info-circle" />
      No conversation selected.
    </p>
    <p>
      Click on a conversation in the sidebar, or <Button class="link" on:click={startChat}
        >start a new one</Button
      >.
    </p>
  </div>
</div>
<div class="content col-2">
  <div class="row-2 min-w-0 flex-grow items-center">
    <label class="input input-bordered flex flex-grow items-center gap-2">
      <Icon icon="magnifer" />
      <!-- svelte-ignore a11y-autofocus -->
      <input autofocus bind:value={term} class="grow" type="text" placeholder="Search for conversations..." />
    </label>
    <Button class="btn btn-primary" on:click={startChat}>
      <Icon icon="add-circle" />
    </Button>
  </div>
  {#each chats as { id, pubkeys, messages } (id)}
    <ChatItem {id} {pubkeys} {messages} class="bg-alt card2" />
  {:else}
    <div class="py-20 max-w-sm col-4 items-center m-auto text-center">
      <p>No chats found! Try starting one up.</p>
      <Button class="btn btn-primary" on:click={startChat}>
        <Icon icon="add-circle" />
        Start a Chat
      </Button>
    </div>
  {/each}
</div>
