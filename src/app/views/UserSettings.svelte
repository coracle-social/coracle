<script lang="ts">
  import {identity} from "ramda"
  import {toast, appName} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {env, getSettings, publishSettings} from "src/engine"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {fuzzy} from "src/util/misc"

  let settings = getSettings()

  const submit = () => {
    publishSettings(settings)

    toast.show("info", "Your settings have been saved!")
  }

  const searchUploadProviders = fuzzy($env.NIP96_URLS, {keys: ["url"]})

  document.title = "Settings"
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>App Settings</Heading>
    <p>Make {appName} work the way you want it to.</p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label="Default zap amount">
      <Input bind:value={settings.default_zap} />
      <p slot="info">The default amount of sats to use when sending a lightning tip.</p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>Max relays per request</strong>
        <div>{settings.relay_limit} relays</div>
      </div>
      <Input type="range" bind:value={settings.relay_limit} min={1} max={50} />
      <p slot="info">
        This controls how many relays to max out at when loading feeds and event context. More is
        faster, but will require more bandwidth and processing power.
      </p>
    </Field>
    <FieldInline label="Authenticate with relays">
      <Toggle bind:value={settings.auto_authenticate} />
      <p slot="info">
        Allows {appName} to authenticate with relays that have access controls automatically.
      </p>
    </FieldInline>
    <Field label="Upload Provider URLs">
      <p slot="info">
        Enter one or more urls for nostr media servers. You can find a full list of NIP-96
        compatible servers
        <Anchor underline href="https://github.com/quentintaranpino/NIP96-compatible-servers"
          >here</Anchor>
      </p>
      <SearchSelect
        search={searchUploadProviders}
        bind:value={settings.nip96_urls}
        termToItem={identity}>
        <div slot="item" let:item>
          <strong>{item}</strong>
        </div>
      </SearchSelect>
    </Field>
    <Field label="Dufflepud URL">
      <Input bind:value={settings.dufflepud_url}>
        <i slot="before" class="fa-solid fa-server" />
      </Input>
      <p slot="info">
        Enter a custom url for {appName}'s helper application. Dufflepud is used for hosting
        images and loading link previews. You can find the source code <Anchor
          underline
          href="https://github.com/coracle-social/dufflepud">here</Anchor
        >.
      </p>
    </Field>
    <Field label="Imgproxy URL">
      <Input bind:value={settings.imgproxy_url}>
        <i slot="before" class="fa-solid fa-image" />
      </Input>
      <p slot="info">
        Enter a custom imgproxy url for resizing images on the fly to reduce bandwidth and improve
        privacy. You can set up your own proxy <Anchor underline href="https://imgproxy.net/"
          >here</Anchor
        >.
      </p>
    </Field>
    {#if $env.FORCE_RELAYS.length === 0}
      <Field label="Multiplextr URL">
        <Input bind:value={settings.multiplextr_url}>
          <i slot="before" class="fa-solid fa-code-merge" />
        </Input>
        <p slot="info">
          Enter a custom proxy server for multiplexing relay connections. This can drastically
          improve resource usage, but has some privacy trade-offs. Leave blank to connect to
          relays directly. You can find the source code <Anchor
            underline
            href="https://github.com/coracle-social/multiplextr">here</Anchor
          >.
        </p>
      </Field>
    {/if}
    <FieldInline label="Report errors and analytics">
      <Toggle bind:value={settings.report_analytics} />
      <p slot="info">
        Keep this enabled if you would like developers to be able to know what features are used,
        and to diagnose and fix bugs.
      </p>
    </FieldInline>
    <Anchor button tag="button" type="submit">Save</Anchor>
  </div>
</form>
