<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Compose from "src/app/shared/Compose.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/router"
  import {publishReview} from "src/engine"

  export let url

  let compose
  let rating

  const onSubmit = () => {
    publishReview(compose.parse(), [
      ["L", "review"],
      ["l", "review/relay", "review"],
      ["rating", rating],
      ["r", url],
    ])

    router.pop()
  }
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <Heading class="text-center">Leave a review</Heading>
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <strong>Your rating:</strong>
          <Rating bind:value={rating} />
        </div>
      </div>
      <Compose
        {onSubmit}
        class="shadow-inset rounded bg-warm px-2 py-2 text-black"
        style="min-height: 6rem"
        bind:this={compose} />
      <Anchor button tag="button" type="submit" class="flex-grow">Send</Anchor>
    </div>
  </Content>
</form>
