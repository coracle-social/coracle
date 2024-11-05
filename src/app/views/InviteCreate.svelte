<script lang="ts">
  import {relaySearch} from "@welshman/app"
  import {identity, without} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {router} from "src/app/util/router"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import ListItem from "src/partials/ListItem.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {pickVals, toSpliced} from "src/util/misc"
  import {onMount} from "svelte"

  export let initialPubkey = null

  const showSection = section => {
    sections = [...sections, section]
  }

  const hideSection = section => {
    sections = without([section], sections)

    if (section === "people") {
      pubkeys = []
    }

    if (section === "relays") {
      relays = []
    }
  }

  const addRelay = url => {
    if (url) {
      relayInput.clear()
      relays = [...relays, {url, claim: ""}]
    }
  }

  const removeRelay = i => {
    relays = toSpliced(relays, i, 1)
  }

  let relayInput
  let sections = []
  let pubkeys = []
  let relays = []

  const onSubmit = () => {
    const invite: any = {}

    if (sections.includes("people")) {
      invite.people = pubkeys.join(",")
    }

    if (sections.includes("relays")) {
      invite.relays = relays.map(r => pickVals(["url", "claim"], r).join("|")).join(",")
    }

    router
      .at("qrcode")
      .of(window.origin + "/invite?" + new URLSearchParams(invite).toString())
      .open()
  }

  onMount(() => {
    if (initialPubkey) {
      showSection("people")
      pubkeys = pubkeys.concat(initialPubkey)
    }

    // Not sure why, but the inputs are getting automatically focused
    setTimeout(() => (document.activeElement as any).blur())
  })
</script>

<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>Create an Invite</Heading>
  <p>
    Invite links allow you to help your friends onboard to nostr more easily, or get easy access to
    relays.
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
        <PersonSelect multiple bind:value={pubkeys} />
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
            <span slot="label">{displayRelayUrl(relay.url)}</span>
            <span slot="data">
              <Input bind:value={relay.claim} placeholder="Claim (optional)" />
            </span>
          </ListItem>
        {/each}
        <SearchSelect
          value={null}
          bind:this={relayInput}
          search={$relaySearch.searchValues}
          termToItem={identity}
          onChange={url => addRelay(url)}>
          <i slot="before" class="fa fa-search" />
          <div slot="item" let:item>
            {displayRelayUrl(item)}
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
</div>
<Anchor button accent disabled={[...pubkeys, ...relays].length === 0} on:click={onSubmit}>
  Create Invite Link
</Anchor>
