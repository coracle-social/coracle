<script>
  import {fly} from 'svelte/transition'
  import {registerRelay} from 'src/state/nostr'
  import toast from 'src/state/toast'
  import {modal} from 'src/state/app'
  import Input from 'src/partials/Input.svelte'
  import Button from 'src/partials/Button.svelte'

  let url = ''

  const submit = e => {
    e.preventDefault()

    if (!url.match(/^wss?:\/\/[\w.:-]+$/)) {
      return toast.show("error", 'That isn\'t a valid websocket url - relay urls should start with "wss://"')
    }

    registerRelay(url)
    modal.set(null)
  }
</script>

<form on:submit={submit} class="flex justify-center py-8 px-4 text-white" in:fly={{y: 20}}>
  <div class="flex flex-col gap-4 max-w-2xl flex-grow">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Add a relay</h1>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Relay URL</strong>
        <Input bind:value={url}>
          <i slot="before" class="fa-solid fa-link" />
        </Input>
        <p class="text-sm text-light">
          The url where the relay is hosted.
        </p>
      </div>
      <Button type="submit" class="text-center">Done</Button>
    </div>
  </div>
</form>
