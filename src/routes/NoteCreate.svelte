<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import Textarea from "src/partials/Textarea.svelte"
  import Button from "src/partials/Button.svelte"
  import {dispatch} from "src/state/dispatch"
  import {user} from "src/state/app"
  import toast from "src/state/toast"

  let values = {}

  const submit = async e => {
    e.preventDefault()

    await dispatch("note/create", values.content)

    toast.show("info", `Your note has been created!`)

    history.back()
  }

  onMount(() => {
    if (!$user) {
      navigate("/login")
    }
  })
</script>

<div class="m-auto">
  <form on:submit={submit} class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
    <div class="flex flex-col gap-4 max-w-lg w-full">
      <div class="flex justify-center items-center flex-col mb-4">
        <h1 class="staatliches text-6xl">Create a note</h1>
      </div>
      <div class="flex flex-col gap-4 w-full">
        <div class="flex flex-col gap-1">
          <strong>What do you want to say?</strong>
          <Textarea rows="8" name="content" bind:value={values.content} />
        </div>
        <Button type="submit" class="text-center">Send</Button>
      </div>
    </div>
  </form>
</div>

