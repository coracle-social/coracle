<script>
  import cx from "classnames"
  import {ellipsize} from "hurdak/lib/hurdak"
  import {fly} from "svelte/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import user from "src/agent/user"

  export let link
  export let onClick = null
  export let onClose = null
  export let showLoading = true

  const loadPreview = async () => {
    const res = await fetch(user.dufflepud("/link/preview"), {
      method: "POST",
      body: JSON.stringify({url: link.url}),
      headers: {
        "Content-Type": "application/json",
      },
    })

    const json = await res.json()

    if (!json.title && !json.image) {
      throw new Error("Unable to load preview")
    }

    return json
  }
</script>

<Anchor
  external
  type="unstyled"
  href={onClick ? null : link.url}
  on:click={onClick}
  style="background-color: rgba(15, 15, 14, 0.5)"
  class={cx("relative flex flex-col overflow-hidden rounded border-solid border-gray-6", {
    border: showLoading || link.type !== "preview",
  })}>
  {#if link.type === "image"}
    <img alt="Link preview" src={link.url} class="max-h-96 object-contain object-center" />
  {:else if link.type === "video"}
    <video controls src={link.url} class="max-h-96 object-contain object-center" />
  {:else}
    {#await loadPreview()}
      {#if showLoading}
        <Spinner />
      {/if}
    {:then { title, description, image }}
      {#if image}
        <img alt="Link preview" src={image} class="max-h-96 object-contain object-center" />
      {/if}
      <div class="h-px bg-gray-6" />
      {#if title}
        <div class="flex flex-col bg-white px-4 py-2 text-black">
          <strong class="overflow-hidden text-ellipsis whitespace-nowrap">{title}</strong>
          <small>{ellipsize(description, 140)}</small>
        </div>
      {/if}
      {#if onClose}
        <div
          on:click|preventDefault={onClose}
          class="absolute top-0 right-0 m-1 flex h-6 w-6 cursor-pointer items-center justify-center
           rounded-full border border-solid border-gray-6 bg-white text-black opacity-50 shadow">
          <i class="fa fa-times" />
        </div>
      {/if}
    {:catch}
      {#if showLoading}
        <p class="mb-1 py-24 px-12 text-center text-gray-5" in:fly={{y: 20}}>
          Unable to load a preview for {link.url}
        </p>
      {/if}
    {/await}
  {/if}
</Anchor>
