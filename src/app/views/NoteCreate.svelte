<script lang="ts">
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {without} from "ramda"
  import {throttle} from "hurdak"
  import {writable} from "svelte/store"
  import {annotateMedia} from "src/util/misc"
  import {fromDisplayEvent} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Media from "src/partials/Media.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"
  import Heading from "src/partials/Heading.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import {Publisher, publishNote, displayRelay, getUserRelayUrls, mention} from "src/engine"
  import {modal} from "src/partials/state"
  import {toastProgress} from "src/app/state"
  import {session, getEventHints, displayPubkey} from "src/engine"

  export let quote = null
  export let pubkey = null
  export let writeTo: string[] | null = null

  let q = ""
  let images = []
  let warning = null
  let compose = null
  let wordCount = 0
  let showPreview = false
  let showSettings = false
  let relays = writable(writeTo ? writeTo : getUserRelayUrls("write"))

  const onSubmit = async () => {
    const tags = []
    const content = compose.parse().trim()

    if (!content) {
      return
    }

    if (warning) {
      tags.push(["content-warning", warning])
    }

    if (quote) {
      tags.push(mention(quote.pubkey))

      // Re-broadcast the note we're quoting
      Publisher.publish({
        relays: $relays,
        event: fromDisplayEvent(quote),
      })
    }

    const pub = await publishNote(content, tags, $relays)

    pub.on("progress", toastProgress)

    modal.clear()
  }

  const addImage = url => {
    images = images.concat(url)
    compose.write("\n" + url)
  }

  const removeImage = url => {
    const content = compose.parse()

    compose.clear()
    compose.write(content.replace(url, ""))

    images = without([url], images)
  }

  const closeSettings = () => {
    q = ""
    showSettings = false
  }

  const saveRelay = url => {
    q = ""
    relays.update($r => $r.concat(url))
  }

  const removeRelay = url => {
    relays.update(without([url]))
  }

  const togglePreview = () => {
    showPreview = !showPreview
  }

  const setWordCount = throttle(300, () => {
    if (compose) {
      wordCount = compose.parse().match(/\s+/g)?.length || 0
    }
  })

  onMount(() => {
    if (pubkey && pubkey !== $session.pubkey) {
      compose.mention(pubkey)
    }

    if (quote) {
      const nevent = nip19.neventEncode({id: quote.id, relays: getEventHints(quote)})

      compose.nevent("nostr:" + nevent)
    }
  })
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Create a note</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-2">
        <strong>What do you want to say?</strong>
        <div
          class="mt-4 rounded-xl border border-solid border-gray-6 p-3"
          class:bg-input={!showPreview}
          class:text-black={!showPreview}
          class:bg-gray-7={showPreview}>
          {#if showPreview}
            <NoteContent note={{content: compose.parse(), tags: []}} />
          {/if}
          <div class:hidden={showPreview}>
            <Compose on:keyup={setWordCount} bind:this={compose} {onSubmit} />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 text-gray-5">
          <small class="hidden sm:block">
            {wordCount} words
          </small>
          <span class="hidden sm:block">•</span>
          <small>
            Posting as @{displayPubkey($session.pubkey)}
          </small>
          <span>•</span>
          <small on:click={togglePreview} class="cursor-pointer underline">
            {showPreview ? "Hide" : "Show"} Preview
          </small>
        </div>
      </div>
      {#if images.length > 0}
        <div class="columns-2 gap-2 lg:columns-3">
          {#each images as url}
            <div class="mb-2">
              <Media link={annotateMedia(url)} onClose={() => removeImage(url)} />
            </div>
          {/each}
        </div>
      {/if}
      <div class="flex gap-2">
        <Anchor tag="button" theme="button" type="submit" class="flex-grow text-center"
          >Send</Anchor>
        <ImageInput multi onChange={addImage} />
      </div>
      <small
        class="flex cursor-pointer items-center justify-end gap-2"
        on:click={() => {
          showSettings = true
        }}>
        <span>
          {#if $relays?.length === 1}
            {displayRelay({url: $relays[0]})}
          {:else}
            {$relays.length} relays
          {/if}
        </span>
        <span>•</span>
        <i class="fa fa-warning" />
        {warning || 0}
        <span>•</span>
        <i class="fa fa-edit" />
      </small>
    </div>
  </Content>
</form>

{#if showSettings}
  <Modal onEscape={closeSettings}>
    <form on:submit|preventDefault={closeSettings}>
      <Content>
        <div class="mb-4 flex items-center justify-center">
          <Heading>Note settings</Heading>
        </div>
        <Field icon="fa-warning" label="Content warnings">
          <Input bind:value={warning} placeholder="Why might people want to skip this post?" />
        </Field>
        <div>Select which relays to publish to:</div>
        <div>
          {#each $relays as url}
            <div
              class="mb-2 mr-1 inline-block rounded-full border border-solid border-gray-1 px-2 py-1">
              <button
                type="button"
                class="fa fa-times cursor-pointer"
                on:click={() => removeRelay(url)} />
              {displayRelay({url})}
            </div>
          {/each}
        </div>
        <RelaySearch bind:q limit={3} hideIfEmpty>
          <div slot="item" let:relay>
            <RelayCard {relay}>
              <button
                slot="actions"
                class="underline"
                on:click|preventDefault={() => saveRelay(relay.url)}>
                Add relay
              </button>
            </RelayCard>
          </div>
        </RelaySearch>
        <Anchor tag="button" theme="button" type="submit" class="w-full text-center">Done</Anchor>
      </Content>
    </form>
  </Modal>
{/if}
