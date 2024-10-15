<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ctx, ago} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
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
    const sub = subscribe({filters: [{...filter, since: ago(30)}]})

    pullConservatively({
      filters: [filter],
      relays: ctx.app.router.InboxRelays().getUrls(),
    })

    return () => sub.close()
  })
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <div in:fly>
      <SecondaryNavItem href="/home/people">
        <Icon icon="user-heart" /> People
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 50}}>
      <SecondaryNavItem href="/home/network">
        <Icon icon="share-circle" /> Network
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 100}}>
      <SecondaryNavItem href="/home/notes">
        <Icon icon="notes-minimalistic" /> Notes
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 150}}>
      <SecondaryNavHeader>
        Chats
        <Button on:click={startChat}>
          <Icon icon="add-circle" />
        </Button>
      </SecondaryNavHeader>
    </div>
  </SecondaryNavSection>
  <label
    class="input input-sm input-bordered mx-6 -mt-4 mb-2 flex items-center gap-2"
    in:fly={{delay: 200}}>
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" />
  </label>
  <div class="overflow-auto">
    {#each chats as { id, pubkeys, messages } (id)}
      <ChatItem {id} {pubkeys} {messages} />
    {/each}
  </div>
</SecondaryNav>

<Page>
  {#key JSON.stringify($page.params)}
    <slot />
  {/key}
</Page>
