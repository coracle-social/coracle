<style>
  .z-nav-active {
    -webkit-mask-image: url("/nav-active.svg");
    mask-image: url("/nav-active.svg");
  }
</style>

<script lang="ts">
  import {goto} from '$app/navigation'
  import {derived} from 'svelte/store'
  import {identity} from '@welshman/lib'
  import Icon from "@lib/components/Icon.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAdd from '@app/components/SpaceAdd.svelte'
  import {session} from "@app/base"
  import {deriveGroupMembership, makeGroupId, getGroup, deriveProfile, qualifiedGroupsById, getGroupNom} from "@app/state"
  import {pushModal} from "@app/modal"

  const addSpace = () => pushModal(SpaceAdd)

  const browseSpaces = () => goto("/browse")


  $: profile = deriveProfile($session?.pubkey)
  $: membership = deriveGroupMembership($session?.pubkey)
  $: userGroupsByNom = derived([membership, qualifiedGroupsById], ([$membership, $qualifiedGroupsById]) => {
    const $userGroupsByNom = new Map()

    for (const id of $membership?.ids || []) {
      const nom = getGroupNom(id)
      const group = $qualifiedGroupsById.get(id)
      const groups = $userGroupsByNom.get(nom) || []

      if (group) {
        groups.push(group)
      }

      $userGroupsByNom.set(nom, groups)
    }

    return $userGroupsByNom
  })
</script>

<div class="relative w-14 bg-base-100">
  <div class="absolute -top-[44px] z-nav-active ml-2 h-[144px] w-12 bg-base-300" />
  <div class="flex h-full flex-col justify-between">
    <div>
      <PrimaryNavItem title={$profile?.name}>
        <div class="!flex w-10 items-center justify-center rounded-full border border-solid border-base-300">
          {#if $profile?.picture}
            <img alt="" src={$profile.picture} />
          {:else}
            <Icon icon="user-rounded" size={7} />
          {/if}
        </div>
      </PrimaryNavItem>
      {#each $userGroupsByNom.entries() as [nom, qualifiedGroups] (nom)}
        {@const qualifiedGroup = qualifiedGroups[0]}
        <PrimaryNavItem title={qualifiedGroup?.group.name}>
          <div class="w-10 rounded-full border border-solid border-base-300">
            <img alt={qualifiedGroup?.group.name} src={qualifiedGroup?.group.picture} />
          </div>
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space" on:click={addSpace}>
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="add-circle" />
        </div>
      </PrimaryNavItem>
      <PrimaryNavItem title="Browse Spaces" on:click={browseSpaces}>
        <div class="!flex w-10 items-center justify-center">
          <Icon size={6} icon="compass-big" />
        </div>
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="settings" />
        </div>
      </PrimaryNavItem>
    </div>
  </div>
</div>
