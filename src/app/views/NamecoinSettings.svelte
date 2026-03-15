<script lang="ts">
  import {appName} from "src/partials/state"
  import {showInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Footer from "src/partials/Footer.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {userSettings, publishSettings} from "src/engine"
  import {
    resolveNamecoinDetailed,
    clearCache,
  } from "src/util/namecoin"

  const namecoinUrl = "https://www.namecoin.org/"

  const values = {
    namecoin_enabled: $userSettings.namecoin_enabled,
    namecoin_proxy_url: $userSettings.namecoin_proxy_url || "",
  }

  let testIdentifier = ""
  let testResult: string | null = null
  let testLoading = false

  const submit = () => {
    publishSettings({...$userSettings, ...values})
    showInfo("Namecoin settings have been saved!")
  }

  const resetDefaults = () => {
    values.namecoin_enabled = true
    values.namecoin_proxy_url = ""
    clearCache()
    showInfo("Namecoin settings reset to defaults and cache cleared.")
  }

  const testResolve = async () => {
    if (!testIdentifier.trim()) return
    testLoading = true
    testResult = null

    try {
      const outcome = await resolveNamecoinDetailed(
        testIdentifier.trim(),
        values.namecoin_proxy_url || undefined,
      )

      switch (outcome.type) {
        case "success":
          testResult = `✓ Resolved! Pubkey: ${outcome.result.pubkey.slice(0, 16)}…${outcome.result.relays.length > 0 ? `\nRelays: ${outcome.result.relays.join(", ")}` : ""}`
          break
        case "name_not_found":
          testResult = `✗ Name not found on blockchain: ${outcome.name}`
          break
        case "no_nostr_field":
          testResult = `✗ Name exists but has no Nostr data: ${outcome.name}`
          break
        case "servers_unreachable":
          testResult = `✗ Could not reach proxy / ElectrumX servers: ${outcome.message}`
          break
        case "invalid_identifier":
          testResult = `✗ Invalid Namecoin identifier: ${outcome.identifier}`
          break
        case "timeout":
          testResult = `✗ Request timed out`
          break
      }
    } catch (e: any) {
      testResult = `✗ Error: ${e?.message || "Unknown error"}`
    } finally {
      testLoading = false
    }
  }

  document.title = "Namecoin Settings"
</script>

<form on:submit|preventDefault={submit}>
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>Namecoin Settings</Heading>
    <p>
      Configure decentralised NIP-05 verification via the
      <Link class="underline" external href={namecoinUrl}>Namecoin</Link> blockchain.
      When enabled, identifiers ending in <code>.bit</code> are resolved from
      the blockchain via an ElectrumX proxy — no centralised HTTP server needed for
      identity verification.
    </p>
  </div>

  <div class="flex w-full flex-col gap-8">
    <FieldInline label="Enable Namecoin resolution">
      <Toggle bind:value={values.namecoin_enabled} />
      <p slot="info">
        When enabled, {appName} will resolve <code>.bit</code> domains, <code>d/</code> and
        <code>id/</code> Namecoin names to Nostr public keys.
      </p>
    </FieldInline>

    {#if values.namecoin_enabled}
      <Field label="Proxy URL (optional)">
        <Input type="text" bind:value={values.namecoin_proxy_url} placeholder="Leave blank for default">
          <i slot="before" class="fa-solid fa-shield-halved" />
        </Input>
        <p slot="info">
          Namecoin resolution requires a lightweight proxy that bridges HTTP to ElectrumX
          servers (browsers cannot make direct TCP connections). Leave blank to use the
          built-in proxy. Set a custom URL if you run your own proxy for better privacy.
          The proxy should accept <code>GET /name/d/example</code> requests.
        </p>
      </Field>

      <Field label="Test Resolution">
        <p slot="info">
          Test that Namecoin resolution is working. Try <code>testls.bit</code>,
          <code>seed@testls.bit</code>, <code>d/testls</code>, or <code>id/alice</code>.
        </p>
        <div class="flex gap-2">
          <Input
            class="flex-grow"
            type="text"
            placeholder="seed@testls.bit"
            bind:value={testIdentifier}
            on:keydown={e => e.key === "Enter" && (e.preventDefault(), testResolve())}>
            <i slot="before" class="fa-solid fa-magnifying-glass" />
          </Input>
          <Button class="btn btn-sm" disabled={testLoading} on:click={testResolve}>
            {testLoading ? "Resolving…" : "Test"}
          </Button>
        </div>
        {#if testResult}
          <pre class="mt-2 whitespace-pre-wrap rounded bg-gray-800 p-3 text-sm {testResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}">{testResult}</pre>
        {/if}
      </Field>
    {/if}

    <div class="flex justify-end">
      <Button class="btn btn-sm" type="button" on:click={resetDefaults}>
        Reset to defaults
      </Button>
    </div>
  </div>

  <Footer>
    <Button class="btn flex-grow" type="submit">Save</Button>
  </Footer>
</form>
