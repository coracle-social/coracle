<script lang="ts">
  import {randomId} from "@welshman/lib"
  import {preventDefault, stopPropagation} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"

  interface Props {
    file?: File | undefined
    url?: string | undefined
  }

  let {file = $bindable(), url = $bindable()}: Props = $props()

  const id = randomId()

  const onDragEnter = () => {
    active = true
  }

  const onDragOver = () => {
    active = true
  }

  const onDragLeave = () => {
    active = false
  }

  const onDrop = (e: any) => {
    active = false

    file = e.dataTransfer.files[0]
  }

  const onChange = (e: any) => {
    file = e.target.files[0]
  }

  const onClear = () => {
    initialUrl = undefined
    file = undefined
    url = undefined
  }

  let active = $state(false)
  let initialUrl = $state(url)

  $effect(() => {
    if (file) {
      const reader = new FileReader()

      reader.addEventListener(
        "load",
        () => {
          url = reader.result as string
        },
        false,
      )
      reader.readAsDataURL(file)
    } else {
      url = initialUrl
    }
  })
</script>

<form>
  <input {id} type="file" accept="image/*" onchange={onChange} class="hidden" />
  <label
    for={id}
    aria-label="Drag and drop files here."
    style="background-image: url({url});"
    class="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-solid border-base-content bg-base-300 bg-cover bg-center transition-all"
    class:transparent={!url}
    class:border-primary={active}
    ondragenter={stopPropagation(preventDefault(onDragEnter))}
    ondragover={stopPropagation(preventDefault(onDragOver))}
    ondragleave={stopPropagation(preventDefault(onDragLeave))}
    ondrop={stopPropagation(preventDefault(onDrop))}>
    <div
      class="absolute right-0 top-0 h-5 w-5 overflow-hidden rounded-full bg-primary"
      class:bg-error={url}
      class:bg-primary={!url}>
      {#if url}
        <span
          role="button"
          tabindex="-1"
          onmousedown={stopPropagation(onClear)}
          ontouchstart={stopPropagation(onClear)}>
          <Icon icon="close-circle" class="scale-150 !bg-base-300" />
        </span>
      {:else}
        <Icon icon="add-circle" class="scale-150 !bg-base-300" />
      {/if}
    </div>
    {#if !url}
      <Icon icon="gallery-send" size={7} />
    {/if}
  </label>
</form>
