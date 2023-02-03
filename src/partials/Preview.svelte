<script>
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'

  export let url
  export let endpoint

  let preview

  onMount(async () => {
    try {
      const res = await fetch(endpoint, {
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
  })
</script>

{#if preview}
<div in:slide class="max-w-sm">
  <Anchor
    external
    href={url}
    class="rounded border border-solid border-medium flex flex-col bg-white overflow-hidden">
    {#if preview.image}
    <img alt="Link preview" src={preview.image} />
    <div class="h-px bg-medium" />
    {/if}
    {#if preview.title}
    <div class="px-4 py-2 text-black flex flex-col bg-white">
      <strong class="whitespace-nowrap text-ellipsis overflow-hidden">{preview.title}</strong>
      <small>{preview.description}</small>
    </div>
    {/if}
  </Anchor>
</div>
{/if}
