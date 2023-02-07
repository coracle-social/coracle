<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import Button from "src/partials/Button.svelte"
  import Compose from "src/partials/Compose.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from 'src/partials/Heading.svelte'
  import {user, getRelays} from "src/agent"
  import {toast} from "src/app"
  import cmd from "src/app/cmd"

  let input = null

  const onSubmit = async () => {
    const {content, mentions, topics} = input.parse()

    if (content) {
      await cmd.createNote(getRelays(), content, mentions, topics)

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
    </div>
  </Content>
</form>

