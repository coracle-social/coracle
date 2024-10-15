<script lang="ts">
  import {onMount} from "svelte"
  import {ctx, ago} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import ChatItem from "@app/components/ChatItem.svelte"
  import {chatSearch, pullConservatively} from "@app/state"

  let term = ""

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
  <label class="input input-bordered mb-2 flex items-center gap-2" in:fly={{delay: 250}}>
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for conversations..." />
  </label>
  <div class="column gap-2 overflow-auto">
    {#each chats as { id, pubkeys, messages } (id)}
      <ChatItem {id} {pubkeys} {messages} />
    {/each}
  </div>
</div>
