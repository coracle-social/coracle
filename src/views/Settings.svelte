<script>
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {navigate} from "svelte-routing"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import user from "src/agent/user"
  import {toast} from "src/app/ui"

  let values = {...user.getSettings()}

  onMount(async () => {
    if (!user.getProfile()) {
      return navigate("/login")
    }
  })

  const submit = async event => {
    event.preventDefault()

    user.profile.update($p => ({...$p, settings: values}))

    toast.show("info", "Your settings have been saved!")
  }

  document.title = "Settings"
</script>

<form on:submit={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>App Settings</Heading>
      <p>Tweak Coracle to work the way you want it to.</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Show images and link previews</strong>
          <Toggle bind:value={values.showMedia} />
        </div>
        <p class="text-sm text-gray-1">
          If enabled, coracle will automatically retrieve a link preview for the last link in any
          note.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Default zap amount</strong>
          <Input bind:value={values.defaultZap} />
        </div>
        <p class="text-sm text-gray-1">
          The default amount of sats to use when sending a lightning tip.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex justify-between">
          <strong>Max relays per request</strong>
          <div>{values.relayLimit} relays</div>
        </div>
        <Input type="range" bind:value={values.relayLimit} min={1} max={50} />
        <p class="mt-2 text-sm text-gray-1">
          This controls how many relays to max out at when loading feeds and event context. More is
          faster, but will require more bandwidth and processing power.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <strong>Dufflepud URL</strong>
        <Input bind:value={values.dufflepudUrl}>
          <i slot="before" class="fa-solid fa-server" />
        </Input>
        <p class="text-sm text-gray-1">
          Enter a custom url for Coracle's helper application. Dufflepud is used for hosting images
          and loading link previews.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Report errors and analytics</strong>
          <Toggle bind:value={values.reportAnalytics} />
        </div>
        <p class="text-sm text-gray-1">
          Keep this enabled if you would like the Coracle developers to be able to know what
          features are used, and to diagnose and fix bugs.
        </p>
      </div>
      <Button type="submit" class="text-center">Save</Button>
    </div>
  </Content>
</form>
