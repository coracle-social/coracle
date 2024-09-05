<script lang="ts">
  import {join, uniqBy} from "ramda"
  import {ucFirst} from "hurdak"
  import {ctx} from "@welshman/lib"
  import {Address, GROUP, COMMUNITY, normalizeRelayUrl, displayRelayUrl} from "@welshman/util"
  import {relaySearch} from "@welshman/app"
  import {toSpliced} from "src/util/misc"
  import {fly} from "src/util/transition"
  import {formCtrl} from "src/partials/utils"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import ListItem from "src/partials/ListItem.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import type {GroupMeta} from "src/domain"
  import {env, feedSearch} from "src/engine"

  export let onSubmit
  export let values: GroupMeta & {members: string[]}
  export let mode = "create"
  export let showMembers = false
  export let buttonText = "Save"

  const toggleAdvanced = () => {
    showAdvanced = !showAdvanced
  }

  const addFeed = address => {
    if (address) {
      const relayHint = ctx.app.router.FromPubkeys([Address.from(address).pubkey]).getUrl()
      const feedTag = ["feed", address, relayHint, "Custom Feed"]

      values.feeds = uniqBy(join(":"), values.feeds.concat([feedTag]))
      feedsInput.clear()
    }
  }

  const removeFeed = i => {
    values.feeds = toSpliced(values.feeds, i, 1)
  }

  const searchRelays = term => $relaySearch.searchValues(term).map(url => ["relay", url])

  const urlToTag = url => ["relay", normalizeRelayUrl(url)]

  const ctrl = formCtrl({
    submit: async () => {
      if (values.relays.length < 1) {
        showWarning("At least one relay is required.")
      } else {
        await onSubmit(values)

        showInfo("Your group has been saved!")
      }
    },
  })

  let feedsInput
  let showAdvanced = false
</script>

<form on:submit|preventDefault={$ctrl.submit} in:fly={{y: 20}}>
  <FlexColumn>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>{ucFirst(mode)} Group</Heading>
      <p>
        {#if values.kind === COMMUNITY}
          An open forum where anyone can participate.
        {:else}
          A private place where members can talk.
        {/if}
      </p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <Field label="Name">
        <Input bind:value={values.name}>
          <i slot="before" class="fa fa-clipboard" />
        </Input>
        <div slot="info">The name of the group</div>
      </Field>
      <Field label="Picture">
        <ImageInput
          bind:value={values.image}
          icon="image-portrait"
          maxWidth={480}
          maxHeight={480} />
        <div slot="info">A picture for the group</div>
      </Field>
      <Field label="Banner">
        <ImageInput bind:value={values.banner} icon="image" maxWidth={4000} maxHeight={4000} />
        <div slot="info">A banner image for the group</div>
      </Field>
      <Field label="About">
        <Textarea bind:value={values.about} />
        <div slot="info">The group's decription</div>
      </Field>
      {#if values.kind === GROUP}
        <FieldInline label="List Publicly">
          <Toggle bind:value={values.listing_is_public} />
          <div slot="info">
            If enabled, this will generate a public listing for the group. The member list and group
            messages will not be published.
          </div>
        </FieldInline>
      {/if}
      {#if env.PLATFORM_RELAYS.length === 0}
        <Field label="Relays">
          <SearchSelect
            multiple
            search={searchRelays}
            bind:value={values.relays}
            termToItem={urlToTag}>
            <i slot="before" class="fa fa-clipboard" />
            <span slot="item" let:item>
              {displayRelayUrl(item[1])}
            </span>
          </SearchSelect>
          <div slot="info">
            Which relays members should publish notes to. For additional privacy, select relays you
            host yourself.
          </div>
        </Field>
      {/if}
      {#if showMembers}
        <Field label="Member List">
          <PersonSelect multiple bind:value={values.members} />
          <div slot="info">All members will receive a fresh invitation with a new key.</div>
        </Field>
      {/if}
      {#if showAdvanced}
        <Anchor on:click={toggleAdvanced} class="flex items-center gap-2">
          <i class="fa fa-caret-down" />
          <span>Hide Advanced Settings</span>
        </Anchor>
        <Field label="Custom Feeds">
          {#each values.feeds as [_, address, hint, label], i (address)}
            <ListItem on:remove={() => removeFeed(i)}>
              <span slot="label">{$feedSearch.displayValue(address)}</span>
              <span slot="data">
                <Input bind:value={label} />
              </span>
            </ListItem>
          {/each}
          <SearchSelect
            onChange={addFeed}
            search={$feedSearch.searchValues}
            bind:this={feedsInput}
            displayItem={$feedSearch.displayValue}>
            <i slot="before" class="fa fa-rss" />
            <span slot="item" let:item>
              {$feedSearch.displayValue(item)}
            </span>
          </SearchSelect>
          <div slot="info">
            Add custom feeds to your group using special-purpose DVMs that are configured to respond
            to
            <Anchor href="https://www.data-vending-machines.org/kinds/5300/" external
              >kind 5300</Anchor> events.
          </div>
        </Field>
      {:else}
        <Anchor on:click={toggleAdvanced} class="flex items-center gap-2">
          <i class="fa fa-caret-right" />
          <span>Show Advanced Settings</span>
        </Anchor>
      {/if}
      <Anchor button loading={$ctrl.loading} tag="button" type="submit">{buttonText}</Anchor>
    </div>
  </FlexColumn>
</form>
