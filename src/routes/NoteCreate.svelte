<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import Button from "src/partials/Button.svelte"
  import Compose from "src/partials/Compose.svelte"
  import toast from "src/state/toast"
  import relay, {user} from "src/relay"

  let input = null

  const onSubmit = async e => {
    const {content, mentions} = input.parse()

    if (content) {
      await relay.cmd.createNote(content, mentions)

      toast.show("info", `Your note has been created!`)

      history.back()
    }
  }

  onMount(() => {
    if (!$user) {
      navigate("/login")
    }
  })
</script>

<div class="m-auto">
  <form on:submit|preventDefault={onSubmit} class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
    <div class="flex flex-col gap-4 max-w-lg w-full">
      <div class="flex justify-center items-center flex-col mb-4">
        <h1 class="staatliches text-6xl">Create a note</h1>
      </div>
      <div class="flex flex-col gap-4 w-full">
        <div class="flex flex-col gap-2">
          <strong>What do you want to say?</strong>
          <div class="border-l-2 border-solid border-medium pl-4">
            <Compose bind:this={input} {onSubmit} />
          </div>
        </div>
        <Button type="submit" class="text-center">Send</Button>
      </div>
    </div>
  </form>
</div>

