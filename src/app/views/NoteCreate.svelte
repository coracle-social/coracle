<script>
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {quantify} from "hurdak/lib/hurdak"
  import {last, reject, pluck, propEq} from "ramda"
  import {fly} from "svelte/transition"
  import {writable} from "svelte/store"
  import {annotateMedia} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import Button from "src/partials/Button.svelte"
  import Compose from "src/partials/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Media from "src/partials/Media.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Heading from "src/partials/Heading.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import {getUserWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import cmd from "src/agent/cmd"
  import user from "src/agent/user"
  import {toast, modal} from "src/partials/state"
  import {publishWithToast} from "src/app/state"

  export let pubkey = null
  export let nevent = null
  export let writeTo = null

  let q = ""
  let image = null
  let compose = null
  let showSettings = false
  let relays = writable(writeTo ? writeTo.map(url => ({url, score: 1})) : getUserWriteRelays())

  const onSubmit = async () => {
    let {content, mentions, topics} = compose.parse()

    if (image) {
      content = content + "\n" + image
    }

    if (content) {
      const thunk = cmd.createNote(content.trim(), mentions, topics)
      const [event, promise] = await publishWithToast($relays, thunk)

      promise.then(() =>
        setTimeout(
          () =>
            toast.show("info", {
              text: `Your note has been created!`,
              link: {
                text: "View",
                href:
                  "/" +
                  nip19.neventEncode({
                    id: event.id,
                    relays: pluck("url", $relays.slice(0, 3)),
                  }),
              },
            }),
          3000
        )
      )

      modal.clear()
    }
  }

  const closeSettings = () => {
    q = ""
    showSettings = false
  }

  const addRelay = relay => {
    q = ""
    relays.update($r => $r.concat(relay))
  }

  const removeRelay = relay => {
    relays.update(reject(propEq("url", relay.url)))
  }

  onMount(() => {
    if (pubkey && pubkey !== user.getPubkey()) {
      compose.mention(getPersonWithFallback(pubkey))
    }

    if (nevent) {
      compose.nevent("nostr:" + nevent)
    }
  })
</script>

<form on:submit|preventDefault={onSubmit} in:fly={{y: 20}}>
  <Content size="lg">
    <Heading class="text-center">Create a note</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-2">
        <strong>What do you want to say?</strong>
        <div class="border-l-2 border-solid border-gray-6 pl-4">
          <Compose bind:this={compose} {onSubmit} />
          <div class="flex justify-end">
            <small class="text-gray-5">
              Posting as @{displayPerson(getPersonWithFallback(user.getPubkey()))}
            </small>
          </div>
        </div>
      </div>
      {#if image}
        <Media
          link={annotateMedia(image)}
          onClose={() => {
            image = null
          }} />
      {/if}
      <div class="flex gap-2">
        <Button type="submit" class="flex-grow text-center">Send</Button>
        <ImageInput bind:value={image} icon="image" hideInput />
      </div>
      <small
        class="flex cursor-pointer items-center justify-end gap-1"
        on:click={() => {
          showSettings = true
        }}>
        <span>Publishing to {quantify($relays.length, "relay")}</span>
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
          <Heading>Note relays</Heading>
        </div>
        <div>Select which relays to publish to:</div>
        <div>
          {#each $relays as relay}
            <div
              class="mr-1 mb-2 inline-block rounded-full border border-solid border-gray-1 py-1 px-2">
              <button
                type="button"
                class="fa fa-times cursor-pointer"
                on:click={() => removeRelay(relay)} />
              {last(relay.url.split("//"))}
            </div>
          {/each}
        </div>
        <RelaySearch bind:q limit={3} hideIfEmpty>
          <div slot="item" let:relay>
            <RelayCard {relay}>
              <button
                slot="actions"
                class="underline"
                on:click|preventDefault={() => addRelay(relay)}>
                Add relay
              </button>
            </RelayCard>
          </div>
          <div slot="footer">
            <Button type="submit" class="w-full text-center">Done</Button>
          </div>
        </RelaySearch>
      </Content>
    </form>
  </Modal>
{/if}
