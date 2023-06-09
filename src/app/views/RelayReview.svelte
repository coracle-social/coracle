<script lang="ts">
  import {fly} from "svelte/transition"
  import {modal} from "src/partials/state"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Rating from "src/partials/Rating.svelte"
  import user from "src/agent/user"
  import cmd from "src/agent/cmd"

  export let url

  let review
  let rating

  const onSubmit = () => {
    cmd
      .createLabel({
        content: review,
        tagClient: false,
        tags: [
          ["L", "social.coracle.ontology"],
          ["l", "review", "social.coracle.ontology"],
          ["r", url],
        ],
      })
      .publish(user.getRelays())

    modal.pop()
  }
</script>

<form on:submit|preventDefault={onSubmit} in:fly={{y: 20}}>
  <Content size="lg">
    <Heading class="text-center">Leave a review</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <strong>Your rating:</strong>
          <Rating bind:value={rating} />
        </div>
      </div>
      <Textarea bind:value={review} placeholder="Share your thoughts..." />
      <Button type="submit" class="flex-grow text-center">Send</Button>
    </div>
  </Content>
</form>
