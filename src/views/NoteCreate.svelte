<script>
  import {liveQuery} from 'dexie'
  import {onMount} from "svelte"
  import {quantify} from 'hurdak/lib/hurdak'
  import {last, whereEq, find, reject, propEq} from 'ramda'
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {fuzzy} from "src/util/misc"
  import Button from "src/partials/Button.svelte"
  import Compose from "src/partials/Compose.svelte"
  import Input from "src/partials/Input.svelte"
  import RelayCardSimple from "src/partials/RelayCardSimple.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Heading from 'src/partials/Heading.svelte'
  import {user, db, getRelays} from "src/agent"
  import {toast, modal} from "src/app"
  import cmd from "src/app/cmd"

  let input = null
  let relays = getRelays()
  let showSettings = false
  let q = ''
  let search

  const knownRelays = liveQuery(() => db.table('relays').toArray())

  $: {
    const data = reject(({url}) => find(whereEq({url}), relays), $knownRelays || [])

    search = fuzzy(data, {keys: ["name", "description", "url"]})
  }

  const onSubmit = async () => {
    const {content, mentions, topics} = input.parse()

    if (content) {
      await cmd.createNote(relays, content, mentions, topics)

      toast.show("info", `Your note has been created!`)

      modal.clear()
    }
  }

  const closeSettings = () => {
    q = ''
    showSettings = false
  }

  const addRelay = relay => {
    q = ''
    relays = relays.concat(relay)
  }

  const removeRelay = relay => {
    relays = reject(propEq('url', relay.url), relays)
  }

  onMount(() => {
    if (!$user) {
      navigate("/login")
    }
  })
</script>

<form on:submit|preventDefault={onSubmit} in:fly={{y: 20}}>
  <Content size="lg">
    <Heading class="text-center">Create a note</Heading>
    <div class="flex flex-col gap-4 w-full">
      <div class="flex flex-col gap-2">
        <strong>What do you want to say?</strong>
        <div class="border-l-2 border-solid border-medium pl-4">
          <Compose bind:this={input} {onSubmit} />
        </div>
      </div>
      <Button type="submit" class="text-center">Send</Button>
      <small
        class="flex justify-end items-center gap-1 cursor-pointer"
        on:click={() => { showSettings = true }}>
        <span>Publishing to {quantify(relays.length, 'relay')}</span>
        <i class="fa fa-edit" />
      </small>
    </div>
  </Content>
</form>

{#if showSettings}
<Modal nested onEscape={closeSettings}>
  <form on:submit|preventDefault={closeSettings}>
    <Content>
      <div class="flex justify-center items-center mb-4">
        <Heading>Note relays</Heading>
      </div>
      <div>Select which relays to publish to:</div>
      <div>
        {#each relays as relay}
        <div class="inline-block py-1 px-2 mr-1 mb-2 rounded-full border border-solid border-light">
          <button type="button" class="fa fa-times cursor-pointer" on:click={() => removeRelay(relay)} />
          {last(relay.url.split('//'))}
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

