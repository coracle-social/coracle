<script>
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {quantify} from "hurdak/lib/hurdak"
  import {last, reject, pluck, propEq} from "ramda"
  import {fly} from "svelte/transition"
  import {fuzzy} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import Button from "src/partials/Button.svelte"
  import Compose from "src/partials/Compose.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Preview from "src/partials/Preview.svelte"
  import Input from "src/partials/Input.svelte"
  import RelayCardSimple from "src/partials/RelayCardSimple.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {getUserWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/tables"
  import {watch} from "src/agent/storage"
  import cmd from "src/agent/cmd"
  import {toast, modal} from "src/app/ui"
  import {publishWithToast} from "src/app"

  export let pubkey = null

  let image = null
  let input = null
  let relays = getUserWriteRelays()
  let showSettings = false
  let q = ""
  let search

  const knownRelays = watch("relays", t => t.all())

  $: {
    const joined = new Set(pluck("url", relays))

    search = fuzzy(
      $knownRelays.filter(r => !joined.has(r.url)),
      {keys: ["name", "description", "url"]}
    )
  }

  const onSubmit = async () => {
    let {content, mentions, topics} = input.parse()

    if (image) {
      content = (content + "\n" + image).trim()
    }

    if (content) {
      const thunk = cmd.createNote(content, mentions, topics)
      const [event, promise] = await publishWithToast(relays, thunk)

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
                    relays: pluck("url", relays.slice(0, 3)),
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
    relays = relays.concat(relay)
  }

  const removeRelay = relay => {
    relays = reject(propEq("url", relay.url), relays)
  }

  onMount(() => {
    if (pubkey) {
      const person = getPersonWithFallback(pubkey)

      input.type("@" + displayPerson(person))
      input.trigger({key: "Enter"})
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
          <Compose bind:this={input} {onSubmit} />
        </div>
      </div>
      {#if image}
        <Preview
          url={image}
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
        <span>Publishing to {quantify(relays.length, "relay")}</span>
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
          {#each relays as relay}
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
        <Input bind:value={q} placeholder="Search for other relays">
          <i slot="before" class="fa fa-search" />
        </Input>
        {#each (q ? search(q) : []).slice(0, 3) as relay (relay.url)}
          <RelayCardSimple {relay}>
            <button slot="actions" class="underline" on:click={() => addRelay(relay)}>
              Add relay
            </button>
          </RelayCardSimple>
        {/each}
        <Button type="submit" class="text-center">Done</Button>
      </Content>
    </form>
  </Modal>
{/if}
