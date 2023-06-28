<script>
  import {fly} from "src/util/transition"
  import {toast, appName} from "src/partials/state"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import user from "src/agent/user"
  import pool from "src/agent/pool"

  let values = {...user.getSettings()}

  const submit = () => {
    user.setSettings(values)

    toast.show("info", "Your settings have been saved!")
  }

  document.title = "Settings"
</script>

<form on:submit|preventDefault={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>App Settings</Heading>
      <p>Make {appName} work the way you want it to.</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Show images and link previews</strong>
          <Toggle bind:value={values.showMedia} />
        </div>
        <p class="text-sm text-gray-4">
          If enabled, {appName} will automatically retrieve a link preview for the last link in any note.
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Default zap amount</strong>
          <Input bind:value={values.defaultZap} />
        </div>
        <p class="text-sm text-gray-4">
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
        <p class="text-sm text-gray-4">
          Enter a custom url for {appName}'s helper application. Dufflepud is used for hosting
          images and loading link previews. You can find the source code <Anchor
            href="https://github.com/coracle-social/dufflepud">here</Anchor
          >.
        </p>
      </div>
      {#if pool.forceUrls.length === 0}
        <div class="flex flex-col gap-1">
          <strong>Multiplextr URL</strong>
          <Input bind:value={values.multiplextrUrl}>
            <i slot="before" class="fa-solid fa-server" />
          </Input>
          <p class="text-sm text-gray-4">
            Enter a custom proxy server for multiplexing relay connections. This can drastically
            improve resource usage, but has some privacy trade-offs. Leave blank to connect to
            relays directly. You can find the source code <Anchor
              href="https://github.com/coracle-social/multiplextr">here</Anchor
            >.
          </p>
        </div>
      {/if}
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <strong>Report errors and analytics</strong>
          <Toggle bind:value={values.reportAnalytics} />
        </div>
        <p class="text-sm text-gray-4">
          Keep this enabled if you would like developers to be able to know what features are used,
          and to diagnose and fix bugs.
        </p>
      </div>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
