<script>
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'
  import user from 'src/agent/user'

  export let url

  let preview

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
    class="rounded border border-solid border-medium flex flex-col bg-medium overflow-hidden">
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
  </Anchor>
</div>
{/if}
