<script lang="ts">
  import {_} from "svelte-i18n"
  import {identity, equals} from "@welshman/lib"
  import {BLOSSOM_SERVERS, tagger, getListTags, getTagValues, makeEvent} from "@welshman/util"
  import {Router} from "@welshman/router"
  import {userBlossomServerList, publishThunk} from "@welshman/app"
  import {ensureProto} from "src/util/misc"
  import {appName, locale} from "src/partials/state"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import Footer from "src/partials/Footer.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {fuzzy, pluralize} from "src/util/misc"
  import WorkEstimate from "src/partials/WorkEstimate.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {env, userSettings, publishSettings} from "src/engine"

  const initialBlossomServers = getTagValues("server", getListTags($userBlossomServerList))

  const submit = () => {
    if (!equals($userSettings, values)) {
      publishSettings(values)
    }

    if (!equals(blossomServers, initialBlossomServers)) {
      const tags = blossomServers.map(ensureProto).map(tagger("server"))

      publishThunk({
        event: makeEvent(BLOSSOM_SERVERS, {tags}),
        relays: Router.get().FromUser().getUrls(),
      })
    }

    showInfo($_("settings.saved"))
  }

  const searchBlossomProviders = fuzzy(env.BLOSSOM_URLS, {keys: ["url"]})

  const values = {...$userSettings}

  let blossomServers = Array.from(initialBlossomServers)

  document.title = $_("settings.title")
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>{$_("settings.appSettings")}</Heading>
    <p>{$_("settings.makeAppWork", {values: {appName}})}</p>
  </div>
  <div class="flex w-full flex-col gap-8">
    <Field label={$_("settings.language")}>
      <select
        class="bg-input rounded border border-solid border-tinted-700 px-4 py-2"
        bind:value={$locale}>
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
      <p slot="info">{$_("settings.languageInfo")}</p>
    </Field>
    <Field label={$_("settings.defaultZapAmount")}>
      <Input bind:value={values.default_zap}>
        <i slot="before" class="fa fa-bolt" />
      </Input>
      <p slot="info">{$_("settings.defaultZapInfo")}</p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("settings.platformZapSplit")}</strong>
        <div>{Math.round(values.platform_zap_split * 100)}%</div>
      </div>
      <Input type="range" step="0.01" bind:value={values.platform_zap_split} min={0} max={0.5} />
      <p slot="info">
        {$_("settings.platformZapInfo", {values: {appName}})}
      </p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("settings.sendDelay")}</strong>
        <div>{values.send_delay / 1000} {pluralize(values.send_delay / 1000, "second")}</div>
      </div>
      <Input type="range" step="1000" bind:value={values.send_delay} min={0} max={15_000} />
      <p slot="info">{$_("settings.sendDelayInfo")}</p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("settings.proofOfWork")}</strong>
        <div>
          {$_("settings.difficulty", {values: {n: values.pow_difficulty}})} (<WorkEstimate
            difficulty={values.pow_difficulty} />)
        </div>
      </div>
      <Input type="range" step="1" bind:value={values.pow_difficulty} min={0} max={32} />
      <p slot="info">{$_("settings.proofOfWorkInfo")}</p>
    </Field>
    <Field>
      <div slot="label" class="flex justify-between">
        <strong>{$_("settings.maxRelays")}</strong>
        <div>{values.relay_limit} {$_("common.relays")}</div>
      </div>
      <Input type="range" bind:value={values.relay_limit} min={1} max={10} parse={parseInt} />
      <p slot="info">
        {$_("settings.maxRelaysInfo")}
      </p>
    </Field>
    <FieldInline label={$_("settings.authenticateRelays")}>
      <Toggle bind:value={values.auto_authenticate2} />
      <p slot="info">
        {$_("settings.authenticateRelaysInfo", {values: {appName}})}
      </p>
    </FieldInline>
    <Field label={$_("settings.blossomUrls")}>
      <p slot="info">{$_("settings.blossomInfo")}</p>
      <SearchSelect
        multiple
        search={searchBlossomProviders}
        bind:value={blossomServers}
        termToItem={identity}>
        <div slot="item" let:item>
          <strong>{item}</strong>
        </div>
      </SearchSelect>
    </Field>
    <Field label={$_("settings.dufflepudUrl")}>
      <Input bind:value={values.dufflepud_url}>
        <i slot="before" class="fa-solid fa-server" />
      </Input>
      <p slot="info">
        {$_("settings.dufflepudInfo", {values: {appName}})} You can find the source code <Link
          class="underline"
          external
          href="https://github.com/coracle-social/dufflepud">{$_("settings.sourceCode")}</Link
        >.
      </p>
    </Field>
    <Field label={$_("settings.imgproxyUrl")}>
      <Input bind:value={values.imgproxy_url}>
        <i slot="before" class="fa-solid fa-image" />
      </Input>
      <p slot="info">
        {$_("settings.imgproxyInfo")} You can set up your own proxy <Link
          class="underline"
          external
          href="https://imgproxy.net/">{$_("settings.imgproxySetup")}</Link
        >.
      </p>
    </Field>
    <FieldInline label={$_("settings.reportAnalytics")}>
      <Toggle bind:value={values.report_analytics} />
      <p slot="info">
        {$_("settings.reportAnalyticsInfo")}
      </p>
    </FieldInline>
    <FieldInline label={$_("settings.clientFingerprinting")}>
      <Toggle bind:value={values.enable_client_tag} />
      <p slot="info">
        {$_("settings.clientFingerprintingInfo", {values: {appName}})}
      </p>
    </FieldInline>
  </div>
  <Footer>
    <Button class="btn flex-grow" type="submit">{$_("common.save")}</Button>
  </Footer>
</form>
