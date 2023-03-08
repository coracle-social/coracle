<script>
  import {onMount} from "svelte"
  import {slide} from "svelte/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"

  export let url
  export let onClose = null

  let preview

  const close = () => {
    onClose?.()
    preview = null
  }

  onMount(async () => {
    if (url.match(".(jpg|jpeg|png|gif)")) {
      preview = {image: url}
    } else if (url.match(".(mov|mp4)")) {
      preview = {video: url}
    } else {
      try {
        const res = await fetch(user.dufflepud("/link/preview"), {
          method: "POST",
          body: JSON.stringify({url}),
          headers: {
            "Content-Type": "application/json",
          },
        })

        const json = await res.json()

        if (json.title || json.image) {
          preview = json
        }
      } catch (e) {
        return
      }
    }
  })
</script>

{#if preview}
  <div in:slide>
    <Anchor
      external
      href={url}
      style="background-color: rgba(15, 15, 14, 0.5)"
      class="relative flex flex-col overflow-hidden rounded border border-solid border-medium">
      {#if preview.image}
        <img alt="Link preview" src={preview.image} class="max-h-96 object-contain object-center" />
      {/if}
      {#if preview.video}
        <video controls src={preview.video} class="max-h-96 object-contain object-center" />
      {/if}
      <div class="h-px bg-medium" />
      {#if preview.title}
        <div class="flex flex-col bg-white px-4 py-2 text-black">
          <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{preview.title}</strong>
          <small>{preview.description}</small>
        </div>
      {/if}
      <div
        on:click|preventDefault={close}
        class="absolute top-0 right-0 m-1 flex h-6 w-6 items-center justify-center
             rounded-full border border-solid border-medium bg-white text-black opacity-50 shadow">
        <i class="fa fa-times" />
      </div>
    </Anchor>
  </div>
{/if}
