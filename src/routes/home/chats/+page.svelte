<script lang="ts">
  import {onMount} from "svelte"
  import {ctx, ago} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import {fly} from "@lib/transition"
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

<div class="content column gap-2">
  <div class="row-2 min-w-0 items-center">
    <label class="input input-bordered flex flex-grow items-center gap-2" in:fly={{delay: 250}}>
      <Icon icon="magnifer" />
      <input bind:value={term} class="grow" type="text" placeholder="Search for conversations..." />
    </label>
    <Button class="btn btn-primary" on:click={startChat}>
      <Icon icon="add-circle" />
    </Button>
  </div>
  <div class="column gap-2 overflow-auto">
    {#each chats as { id, pubkeys, messages } (id)}
      <ChatItem {id} {pubkeys} {messages} />
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
</div>
