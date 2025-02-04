<script lang="ts">
  import {page} from "$app/stores"
  import {ctx} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
  import ChatItem from "@app/components/ChatItem.svelte"
  import {chatSearch} from "@app/state"
  import {pullConservatively} from "@app/requests"
  import {pushModal} from "@app/modal"
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()

  const startChat = () => pushModal(ChatStart)

  const promise = pullConservatively({
    filters: [{kinds: [WRAP], "#p": [$pubkey!]}],
    relays: ctx.app.router.UserInbox().getUrls(),
  })

  let term = $state("")

  const chats = $derived($chatSearch.searchOptions(term))
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <SecondaryNavHeader>
      Chats
      <Button onclick={startChat}>
        <Icon icon="add-circle" />
      </Button>
    </SecondaryNavHeader>
  </SecondaryNavSection>
  <label class="input input-sm input-bordered mx-6 -mt-4 mb-2 flex items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" />
  </label>
  <div class="overflow-auto">
    {#each chats as { id, pubkeys, messages } (id)}
      <ChatItem {id} {pubkeys} {messages} />
    {/each}
    {#await promise}
      <div class="border-t border-solid border-base-100 px-6 py-4 text-xs">
        <Spinner loading>Loading conversations...</Spinner>
      </div>
    {/await}
  </div>
</SecondaryNav>
<Page>
  {#key $page.url.pathname}
    {@render children?.()}
  {/key}
</Page>
