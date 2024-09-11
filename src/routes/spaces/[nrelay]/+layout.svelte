<script lang="ts">
  import {nip19} from 'nostr-tools'
  import {page} from "$app/stores"
  import {sort} from '@welshman/lib'
  import {displayRelayUrl} from '@welshman/util'
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Button from "@lib/components/Button.svelte"
  import Popover from "@lib/components/Popover.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavHeader from "@lib/components/SecondaryNavHeader.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
  import SpaceExit from "@app/components/SpaceExit.svelte"
  import SpaceJoin from "@app/components/SpaceJoin.svelte"
  import RoomCreate from "@app/components/RoomCreate.svelte"
  import {userMembership, decodeNEvent} from "@app/state"
  import {pushModal} from "@app/modal"
  import {makeSpacePath} from "@app/routes"

  const openMenu = () => {
    showMenu = true
  }

  const toggleMenu = () => {
    showMenu = !showMenu
  }

  const leaveSpace = () => pushModal(SpaceExit, {url})

  const joinSpace = () => pushModal(SpaceJoin, {url})

  const addRoom = () => pushModal(RoomCreate, {url})

  let showMenu = false

  $: url = decodeNEvent($page.params.nrelay)
  $: rooms = sort($userMembership?.topicsByUrl?.get(url) || [])
</script>

{#key url}
  <SecondaryNav>
    <SecondaryNavSection>
      <div>
        <SecondaryNavItem class="w-full !justify-between" on:click={openMenu}>
          <strong>{displayRelayUrl(url)}</strong>
          <Icon icon="alt-arrow-down" />
        </SecondaryNavItem>
        {#if showMenu}
          <Popover hideOnClick onClose={toggleMenu}>
            <ul
              transition:fly|local
              class="menu absolute z-popover mt-2 w-full rounded-box bg-base-100 p-2 shadow-xl">
              {#if $userMembership?.topicsByUrl.has(url)}
                <li class="text-error">
                  <Button on:click={leaveSpace}>
                    <Icon icon="exit" />
                    Leave Space
                  </Button>
                </li>
              {:else}
                <li>
                  <Button on:click={joinSpace}>
                    <Icon icon="login-2" />
                    Join Space
                  </Button>
                </li>
              {/if}
            </ul>
          </Popover>
        {/if}
      </div>
      <div class="my-3 h-px bg-base-200" />
      <div in:fly|local>
        <SecondaryNavItem href={makeSpacePath(url)}>
          <Icon icon="chat-round" /> Chat
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 50}}>
        <SecondaryNavItem href={makeSpacePath(url, "threads")}>
          <Icon icon="notes-minimalistic" /> Threads
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 100}}>
        <SecondaryNavItem href={makeSpacePath(url, "events")}>
          <Icon icon="calendar-minimalistic" /> Calendar
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 150}}>
        <SecondaryNavItem href={makeSpacePath(url, "listings")}>
          <Icon icon="shop-minimalistic" /> Market
        </SecondaryNavItem>
      </div>
      <div in:fly|local={{delay: 200}}>
        <div class="h-2" />
        <SecondaryNavHeader>
          Rooms
          <Button on:click={addRoom}>
            <Icon icon="add-circle" />
          </Button>
        </SecondaryNavHeader>
      </div>
      {#each rooms as topic, i (topic)}
        <div transition:fly|local={{delay: 250 + i * 50}}>
          <SecondaryNavItem href={makeSpacePath(url, topic)}>
            <Icon icon="hashtag" /> {topic}
          </SecondaryNavItem>
        </div>
      {/each}
    </SecondaryNavSection>
  </SecondaryNav>
  <Page>
    <slot />
  </Page>
{/key}
