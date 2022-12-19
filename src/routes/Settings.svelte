<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import {settings} from "src/state/app"
  import toast from "src/state/toast"
  import {user} from "src/relay"

  let values = {...$settings}

  onMount(async () => {
    if (!$user) {
      return navigate("/login")
    }
  })

  const submit = async event => {
    event.preventDefault()

    settings.set(values)

    navigate('/notes/global')

    toast.show("info", "Your settings have been saved!")
  }
</script>

<form on:submit={submit} class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
  <div class="flex flex-col gap-4 max-w-2xl">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">App Settings</h1>
      <p>
        Tweak Coracle to work the way you want it to.
      </p>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <strong>Show Link Previews</strong>
        <Toggle bind:value={values.showLinkPreviews} />
        <p class="text-sm text-light">
          If enabled, coracle will automatically retrieve a link preview for the first link
          in any note.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Dufflepud URL</strong>
        <Input bind:value={values.dufflepudUrl}>
          <i slot="before" class="fa-solid fa-server" />
        </Input>
        <p class="text-sm text-light">
          Enter a custom url for Coracle's helper application. Dufflepud is used for
          hosting images and loading link previews.
        </p>
      </div>
      <Button type="submit" class="text-center">Save</Button>
    </div>
  </div>
</form>
