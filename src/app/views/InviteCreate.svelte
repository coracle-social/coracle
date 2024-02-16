<script lang="ts">
  import {without, prop, objOf} from 'ramda'
  import {onMount} from 'svelte'
  import {ninviteEncode} from 'src/util/invite'
  import type {InvitePointer} from 'src/util/invite'
  import Card from "src/partials/Card.svelte"
  import Chips from "src/partials/Chips.svelte"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {router} from 'src/app/router'
  import {env, displayRelay, searchRelays, searchGroups, displayGroup, deriveGroup, getGroupHint} from 'src/engine'

  export let initialGroupAddress = null

  const showSection = section => {
    sections = [...sections, section]
  }

  const hideSection = section => {
    sections = without([section], sections)

    if (section === "people") {
      people = []
    }

    if (section === "relays") {
      relays = []
      relayTerm = ""
      relayClaim = ""
      relaySelection = null
    }

    if (section === "groups") {
      groups = []
      groupTerm = ""
      groupClaim = ""
      groupSelection = null
    }
  }

  const addRelay = e => {
    relays = [...relays, {url: relaySelection.url, claim: relayClaim}]
    relayTerm = ""
    relayClaim = ""
    relaySelection = null

    relayWrapper.querySelector('input').focus()
 }

  const removeRelay = i => {
    relays = relays.slice(0, i).concat(relays.slice(i + 1))
  }

  const displayRelayForChip = g => {
    let display = displayRelay(g)

    if (g.claim) {
      display += ` (invite code: ${g.claim})`
    }

    return display
  }

  const addGroup = e => {
    const newGroup = {
      address: groupSelection.address,
      relay: getGroupHint(groupSelection.address),
      claim: groupClaim,
    }

    groups = [...groups, newGroup]
    groupTerm = ""
    groupSelection = ""
    groupClaim = ""

    groupWrapper.querySelector('input').focus()
 }

  const removeGroup = i => {
    groups = groups.slice(0, i).concat(groups.slice(i + 1))
  }

  const displayGroupFromAddress = a =>
    displayGroup(deriveGroup(a).get())

  const displayGroupForChip = g => {
    let display = displayGroupFromAddress(g.address)

    if (g.claim) {
      display += ` (invite code: ${g.claim})`
    }

    return display
  }

  let sections = []
  let people = []
  let relays = []
  let groups = []
  let relayTerm
  let relaySelection
  let relayClaim
  let relayWrapper
  let groupTerm = initialGroupAddress ? displayGroupFromAddress(initialGroupAddress) : ""
  let groupSelection = initialGroupAddress ? deriveGroup(initialGroupAddress).get() : null
  let groupClaim
  let groupWrapper

  const onSubmit = () => {
    const invite: InvitePointer = {}

    if (sections.includes('people')) {
      invite.people = people.map(p => p.pubkey)
    }

    if (sections.includes('relays')) {
      invite.relays = relays
    }

    if (sections.includes('groups')) {
      invite.groups = groups
    }

    router.at('qrcode').of(ninviteEncode(invite)).open()
  }

  onMount(() => {
    if (initialGroupAddress) showSection('groups')

    // Not sure why, but the inputs are getting automatically focused
    setTimeout(() => document.activeElement.blur())
  })
</script>


<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>Create an Invite</Heading>
  <p>Invite links allow you to help your friends onboard to nostr more easily, or get easy access to relays or groups.</p>
</div>
{#each sections as section (section)}
  {#if section === 'people'}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>People</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection('people')} />
        </div>
        <p>Suggest people to follow - this is especially useful for new users.</p>
        <PersonMultiSelect bind:value={people} />
      </FlexColumn>
    </Card>
  {:else if section === 'relays'}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Relays</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection('relays')} />
        </div>
        <p>Invite people to a private relay. Make sure the relay supports invite codes, and that the code is valid.</p>
        <Chips items={relays.map(displayRelayForChip)} remove={removeRelay} />
        <div class="flex gap-2" bind:this={relayWrapper}>
          <SearchSelect bind:value={relaySelection} search={$searchRelays} getKey={prop('url')} bind:term={relayTerm} termToItem={objOf('url')}>
            <i slot="before" class="fa fa-search" />
            <div slot="item" let:item>
              {displayRelay(item)}
            </div>
          </SearchSelect>
          <Input bind:value={relayClaim} placeholder="Claim (optional)" />
          <Anchor button on:click={addRelay} disabled={!relaySelection}>Add Relay</Anchor>
        </div>
      </FlexColumn>
    </Card>
  {:else if section === 'groups'}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Groups</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection('groups')} />
        </div>
        <p>Invite people to groups. If you're inviting someone to a closed group, make sure the invite code you use is valid.</p>
        <Chips items={groups.map(displayGroupForChip)} remove={removeGroup} />
        <div class="flex gap-2" bind:this={groupWrapper}>
          <SearchSelect bind:value={groupSelection} search={$searchGroups} getKey={prop('address')} displayItem={g => g ? displayGroup(g) : ""} bind:term={groupTerm}>
            <i slot="before" class="fa fa-search" />
            <div slot="item" let:item class="flex gap-4 text-lightest items-center">
              <GroupCircle address={item.address} class="h-5 w-5" />
              <GroupName address={item.address} />
            </div>
          </SearchSelect>
          <Input bind:value={groupClaim} placeholder="Claim (optional)" />
          <Anchor button on:click={addGroup} disabled={!groupSelection}>Add Group</Anchor>
        </div>
      </FlexColumn>
    </Card>
  {/if}
{/each}
<div class="flex justify-end gap-4">
  <Anchor disabled={sections.includes('people')} on:click={() => showSection('people')}>
    <i class="fa fa-plus" /> Add people
  </Anchor>
  <Anchor disabled={sections.includes('relays')} on:click={() => showSection('relays')}>
    <i class="fa fa-plus" /> Add relays
  </Anchor>
  <Anchor disabled={sections.includes('groups')} on:click={() => showSection('groups')}>
    <i class="fa fa-plus" /> Add groups
  </Anchor>
</div>
<Anchor button accent on:click={onSubmit}>Create Invite Link</Anchor>
