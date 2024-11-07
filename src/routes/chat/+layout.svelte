<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {WEEK, ctx, ago} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import ChatItem from "@app/components/ChatItem.svelte"
  import {chatSearch, pullConservatively} from "@app/state"
  import {pushModal} from "@app/modal"

  const startChat = () => pushModal(ChatStart)

  let term = ""

  $: chats = $chatSearch.searchOptions(term).filter(c => c.pubkeys.length > 1)

  onMount(() => {
    const filter = {kinds: [WRAP], "#p": [$pubkey!]}
    const relays = ctx.app.router.UserInbox().getUrls()
    const sub = subscribe({filters: [{...filter, since: ago(WEEK)}], relays})

    pullConservatively({filters: [filter], relays})

    return () => sub.close()
  })
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <SecondaryNavHeader>
      Chats
      <Button on:click={startChat}>
        <Icon icon="add-circle" />
      </Button>
    </SecondaryNavHeader>
  </SecondaryNavSection>
  <label class="input input-sm input-bordered mx-6 -mt-4 mb-2 flex items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" />
  </label>
  {#key $page.params.chat}
    <div class="overflow-auto">
      {#each chats as { id, pubkeys, messages } (id)}
        <ChatItem {id} {pubkeys} {messages} />
      {/each}
    </div>
  {/key}
</SecondaryNav>

<Page>
  {#key JSON.stringify($page.params)}
    <slot />
  {/key}
</Page>
