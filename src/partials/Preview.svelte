<script>
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'
  import user from 'src/agent/user'

  export let url
  export let onClose = null

  let preview

  const close = () => {
    onClose?.()
    preview = null
  }

  onMount(async () => {
    if (url.match('\.(jpg|jpeg|png|gif)')) {
      preview = {image: url}
    } else if (url.match('\.(mov|mp4)')) {
      preview = {video: url}
    } else {
      try {
        const res = await fetch(user.dufflepud('/link/preview'), {
          method: 'POST',
          body: JSON.stringify({url}),
          headers: {
            'Content-Type': 'application/json',
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
    class="relative rounded border border-solid border-medium flex flex-col bg-medium overflow-hidden">
    {#if preview.image}
    <img alt="Link preview" src={preview.image} class="object-center max-h-96 object-contain" />
    {/if}
    {#if preview.video}
    <video controls src={preview.video} class="object-center max-h-96 object-contain" />
    {/if}
    <div class="h-px bg-medium" />
    {#if preview.title}
    <div class="px-4 py-2 text-black flex flex-col bg-white">
      <strong class="whitespace-nowrap text-ellipsis overflow-hidden">{preview.title}</strong>
      <small>{preview.description}</small>
    </div>
    {/if}
    <div
      on:click|preventDefault={close}
      class="w-6 h-6 rounded-full bg-white border border-solid border-medium shadow absolute
             top-0 right-0 m-1 text-black flex justify-center items-center opacity-50">
      <i class="fa fa-times" />
    </div>
  </Anchor>
</div>
{/if}
