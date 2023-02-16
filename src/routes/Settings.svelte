<script>
  import {onMount} from "svelte"
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {user} from 'src/agent/user'
  import {toast, settings} from "src/app"

  let values = {...$settings}

  onMount(async () => {
    if (!$user) {
      return navigate("/login")
    }
  })

  const submit = async event => {
    event.preventDefault()

    settings.set(values)

    toast.show("info", "Your settings have been saved!")
  }
</script>

<form on:submit={submit} in:fly={{y: 20}}>
  <Content>
    <div class="flex justify-center items-center flex-col mb-4">
      <Heading>App Settings</Heading>
      <p>
        Tweak Coracle to work the way you want it to.
      </p>
    </div>
    <div class="flex flex-col gap-8 w-full">
      <div class="flex flex-col gap-1">
        <div class="flex gap-2 items-center">
          <strong>Show Link Previews</strong>
          <Toggle bind:value={values.showLinkPreviews} />
        </div>
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
      <div class="flex flex-col gap-1">
        <div class="flex gap-2 items-center">
          <strong>Report Errors and Analytics</strong>
          <Toggle bind:value={values.reportAnalytics} />
        </div>
        <p class="text-sm text-light">
          Keep this enabled if you would like the Coracle developers to be able to
          know what features are used, and to diagnose and fix bugs.
        </p>
      </div>
      <Button type="submit" class="text-center">Save</Button>
    </div>
  </Content>
</form>
