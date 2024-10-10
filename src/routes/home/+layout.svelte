<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {ctx, ago, remove} from "@welshman/lib"
  import {WRAP} from "@welshman/util"
  import {pubkey, subscribe} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Link from "@lib/components/Link.svelte"
  import Button from "@lib/components/Button.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import Name from "@app/components/Name.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import ChatStart from "@app/components/ChatStart.svelte"
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
    {#each chats as { id, pubkeys, messages }, i (id)}
      {@const message = messages[0]}
      {@const others = remove($pubkey, pubkeys)}
      {@const active = $page.params.chat === id}
      <div
        class="cursor-pointer border-t border-solid border-base-100 px-6 py-2 transition-colors hover:bg-base-100"
        class:bg-base-100={active}>
        <Link class="flex flex-col justify-start gap-1" href="/home/{id}">
          <div class="flex items-center gap-2">
            {#if others.length === 1}
              <ProfileCircle pubkey={others[0]} size={5} />
              <Name pubkey={others[0]} />
            {:else}
              <ProfileCircles pubkeys={others} size={5} />
              <p class="overflow-hidden text-ellipsis whitespace-nowrap">
                <Name pubkey={others[0]} />
                and {others.length - 1}
                {others.length > 2 ? "others" : "other"}
              </p>
            {/if}
          </div>
          <p class="overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {message.content}
          </p>
        </Link>
      </div>
    {/each}
  </div>
</SecondaryNav>

<Page>
  <slot />
</Page>
