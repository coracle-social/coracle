<script lang="ts">
  import {without, prop, objOf} from "ramda"
  import {onMount} from "svelte"
  import {pickVals} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import ListItem from "src/partials/ListItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {router} from "src/app/util/router"
  import {
    hints,
    derivePerson,
    displayRelay,
    searchRelays,
    searchGroups,
    displayGroup,
    deriveGroup,
  } from "src/engine"

  export let initialPubkey = null
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
    }

    if (section === "groups") {
      groups = []
    }
  }

  const addRelay = url => {
    relayInput.clear()
    relays = [...relays, {url, claim: ""}]
  }

  const removeRelay = i => {
    relays = relays.toSpliced(i, 1)
  }

  const addGroup = address => {
    groupInput.clear()
    groups = [
      ...groups,
      {
        address: address,
        relay: hints.WithinContext(address).getUrl(),
        claim: "",
      },
    ]
  }

  const removeGroup = i => {
    groups = groups.toSpliced(i, 1)
  }

  const displayGroupFromAddress = a => displayGroup(deriveGroup(a).get())

  let relayInput, groupInput
  let sections = []
  let people = []
  let relays = []
  let groups = []

  const onSubmit = () => {
    const invite: any = {}

    if (sections.includes("people")) {
      invite.people = people.map(p => p.pubkey).join(",")
    }

    if (sections.includes("relays")) {
      invite.relays = relays.map(r => pickVals(["url", "claim"], r).join("|")).join(",")
    }

    if (sections.includes("groups")) {
      invite.groups = groups
        .map(g => pickVals(["address", "relay", "claim"], g).join("|"))
        .join(",")
    }

    router
      .at("qrcode")
      .of(window.origin + "/invite?" + new URLSearchParams(invite).toString())
      .open()
  }

  onMount(() => {
    if (initialPubkey) {
      showSection("people")
      people = people.concat(derivePerson(initialPubkey).get())
    }

    if (initialGroupAddress) {
      showSection("groups")
      groups = groups.concat({
        address: initialGroupAddress,
        relay: hints.WithinContext(initialGroupAddress).getUrl(),
        claim: "",
      })
    }

    // Not sure why, but the inputs are getting automatically focused
    setTimeout(() => (document.activeElement as any).blur())
  })
</script>

<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>Create an Invite</Heading>
  <p>
    Invite links allow you to help your friends onboard to nostr more easily, or get easy access to
    relays or groups.
  </p>
</div>
{#each sections as section (section)}
  {#if section === "people"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>People</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("people")} />
        </div>
        <p>Suggest people to follow - this is especially useful for new users.</p>
        <PersonMultiSelect bind:value={people} />
      </FlexColumn>
    </Card>
  {:else if section === "relays"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Relays</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("relays")} />
        </div>
        <p>
          Invite people to use specific relays. An invite code can optionally be provided to grant
          access to private relays.
        </p>
        {#each relays as relay, i (relay.url + i)}
          <ListItem on:remove={() => removeRelay(i)}>
            <span slot="label">{displayRelay(relay)}</span>
            <span slot="data">
              <Input bind:value={relay.claim} placeholder="Claim (optional)" />
            </span>
          </ListItem>
        {/each}
        <SearchSelect
          value={null}
          bind:this={relayInput}
          search={$searchRelays}
          getKey={prop("url")}
          termToItem={objOf("url")}
          onChange={r => addRelay(r.url)}>
          <i slot="before" class="fa fa-search" />
          <div slot="item" let:item>
            {displayRelay(item)}
          </div>
        </SearchSelect>
      </FlexColumn>
    </Card>
  {:else if section === "groups"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Groups</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("groups")} />
        </div>
        <p>
          Invite people to groups. If you're inviting someone to a closed group, make sure the
          invite code you use is valid.
        </p>
        {#each groups as group, i (group.address + i)}
          <ListItem on:remove={() => removeGroup(i)}>
            <span slot="label">{displayGroupFromAddress(group.address)}</span>
            <span slot="data">
              <Input bind:value={group.claim} placeholder="Invite code (optional)" />
            </span>
          </ListItem>
        {/each}
        <SearchSelect
          value={null}
          bind:this={groupInput}
          search={$searchGroups}
          getKey={prop("address")}
          onChange={g => addGroup(g.address)}
          displayItem={g => (g ? displayGroup(g) : "")}>
          <i slot="before" class="fa fa-search" />
          <div slot="item" let:item class="flex items-center gap-4 text-neutral-100">
            <GroupCircle address={item.address} class="h-5 w-5" />
            <GroupName address={item.address} />
          </div>
        </SearchSelect>
      </FlexColumn>
    </Card>
  {/if}
{/each}
<div class="flex justify-end gap-4">
  <Anchor disabled={sections.includes("people")} on:click={() => showSection("people")}>
    <i class="fa fa-plus" /> Add people
  </Anchor>
  <Anchor disabled={sections.includes("relays")} on:click={() => showSection("relays")}>
    <i class="fa fa-plus" /> Add relays
  </Anchor>
  <Anchor disabled={sections.includes("groups")} on:click={() => showSection("groups")}>
    <i class="fa fa-plus" /> Add groups
  </Anchor>
</div>
<Anchor button accent disabled={[...people, ...relays, ...groups].length === 0} on:click={onSubmit}>
  Create Invite Link
</Anchor>
