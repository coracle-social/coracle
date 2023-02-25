<script lang="ts">
  import cx from "classnames"
  import {nip05, nip19} from "nostr-tools"
  import {last} from "ramda"
  import {toast} from "src/app/ui"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {copyToClipboard} from "src/util/html"
  import {warn} from "src/util/logger"
  import {stringToColor} from "src/util/misc"
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"

  // Re-use the person and nip05 identifier
  // from the PersonDetail component context
  export let nip05identifier = null
  export let person: any = {}

  // local items
  let nip05ProfileData = null
  let nip05QueryEndpoint = null
  let nProfile = null
  let npub = person?.pubkey ? nip19.npubEncode(person?.pubkey) : null

  // local state
  let loaded = false

  // controls whether nprofile is displayed.
  let displayNprofile = false

  onMount(() => {
    if (nip05identifier) {
      // get target URI
      nip05QueryEndpoint = getNip05QueryEndpoint(nip05identifier)
      // nip05QueryEndpoint = getNip05QueryURI(`NostrVerified.com`)

      // calculate nProfile from NIP05 data, if available
      nProfile = nip19.nprofileEncode({
        pubkey: person.pubkey,
        relays: person?.relays,
      })

      // fetch data
      nip05
        .queryProfile(nip05identifier)
        .then((data) => {
          nip05ProfileData = data

          // recalculate nprofile using NIP05 relay data, if specified.
          // In theory, those *should* be the user's prefered relay set.
          if (nip05ProfileData?.relays?.length) {
            nProfile = nip19.nprofileEncode({
              pubkey: person.pubkey,
              relays: nip05ProfileData.relays,
            })
          }
        })
        .catch((err) => {
          warn("NIP05 profile retrieval failed")
        })
        .finally(() => {
          loaded = true
        })
    } else {
      loaded = true
    }
  })

  // Construct NIP05 URL from identifier.
  function getNip05QueryEndpoint(identifier) {
    if (!identifier) return null

    let name, domain

    if (identifier.match(/^.*@.*$/)) {
      [name, domain] = identifier.split("@")
    } else {
      // In case of no name (domain-only), mimick the reasonable
      // (but somewhat questionable) behaviour of nostr-tools/nip05,
      // which defaults the name value
      [name, domain] = ["_", identifier]
    }
    return `https://${domain}/.well-known/nostr.json?name=${name}`
  }

  // helper: clipboard & toast
  function copy(text) {
    copyToClipboard(text)
    toast.show("info", `Copied.`)
  }
</script>

<div in:fly={{y: 20}}>
  <Content>
    <h2 class="text-3xl staatliches my-4">General</h2>

    <div class="">
      <div class="text-lg font-bold mb-1">Public Key (Hex)</div>
      <div class="text-sm font-mono">
        <button
          class="fa-solid fa-copy cursor-pointer"
          on:click={() => copy(person?.pubkey)}
        />
        {person?.pubkey || "?"}
      </div>
    </div>

    <div class="">
      <div class="text-lg font-bold mb-1">Public Key (npub)</div>
      <div class="text-sm font-mono">
        {#if npub}
          <button
            class="fa-solid fa-copy cursor-pointer"
            on:click={() => copy(npub)}
          />
        {/if}
        {person?.pubkey ? nip19.npubEncode(person?.pubkey) : "?"}
      </div>
    </div>

    {#if displayNprofile}
      <div class="">
        <div class="text-lg font-bold mb-1">nprofile</div>
        <div class="text-sm font-mono" style="overflow-wrap: anywhere;">
          {#if nProfile}
            <button
              class="fa-solid fa-copy cursor-pointer inline"
              on:click={() => copy(nProfile)}
            />
          {/if}
          {nProfile || "?"}
        </div>
      </div>
    {/if}

    {#if !loaded}
      <Spinner delay={10} />
    {/if}

    {#if loaded && nip05identifier}
      <h2 class="text-3xl staatliches my-4">NIP05</h2>

      <div class="">
        <div class="text-lg font-bold mb-1">NIP05 Identifier</div>
        <div class="text-sm font-mono">
          {#if nip05identifier}
            <button
              class="fa-solid fa-copy cursor-pointer inline"
              on:click={() => copy(nip05identifier)}
            />
          {/if}
          {nip05identifier || "?"}
        </div>
      </div>

      <div class="">
        <div class="text-lg font-bold mb-1">NIP05 Validation Endpoint</div>
        <div class="text-sm font-mono">
          {#if nip05QueryEndpoint}
            <button
              class="fa-solid fa-copy cursor-pointer inline"
              on:click={() => copy(nip05QueryEndpoint)}
            />
          {/if}

          {nip05QueryEndpoint || "?"}
        </div>
      </div>

      {#if nip05ProfileData}
        <div class="">
          <div class="text-lg font-bold mb-2">NIP05 Relay Configuration</div>
          {#if nip05ProfileData?.relays?.length}
            <p class="text-sm mb-4 text-light">
              <i class="fa-solid fa-info-circle" />
              These relays are advertised by the NIP05 identifier's validation endpoint.
            </p>

            <div class="grid grid-cols-1 gap-4">
              {#each nip05ProfileData?.relays as r}
                <div class="text-sm font-mono">
                  <div
                    class={cx(
                      `bg-dark`,
                      "rounded border border-l-2 border-solid border-medium shadow flex flex-col justify-between gap-3 py-3 px-6"
                    )}
                    style={`border-left-color: ${stringToColor(r)}`}
                    in:fly={{y: 20}}
                  >
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2 items-center text-xl">
                        <i
                          class={r.startsWith("wss")
                            ? "fa fa-lock"
                            : "fa fa-unlock"}
                        />
                        <Anchor type="unstyled" href={`/relays/${btoa(r)}`}>
                          {last(r.split("://"))}
                        </Anchor>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm mb-4 text-light">
              <i class="fa-solid fa-info-circle" />
              No relays are advertised by the NIP05 identifier's validation endpoint.
            </p>
          {/if}
        </div>
      {:else}
        <p>
          <i class="fa-solid fa-warning text-warning mr-2" />Could not fetch
          NIP05 data.
        </p>
      {/if}
    {/if}
  </Content>
</div>
