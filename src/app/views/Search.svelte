<script lang="ts">
  import {onDestroy} from "svelte"
  import {throttle} from "throttle-debounce"
  import QrScanner from "qr-scanner"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {parseAnything} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import {router} from "src/app/router"
  import {searchTerm} from "src/app/state"

  const startScanner = () => {
    scanner = new Promise(resolve => {
      setTimeout(async () => {
        const scanner = new QrScanner(video, r => tryParseEntity(r.data), {
          returnDetailedScanResult: true,
        })

        await scanner.start()

        resolve(scanner)
      }, 1000)
    })
  }

  const stopScanner = () => {
    scanner?.then(async s => {
      await s.stop()
      await s.destroy()
    })

    scanner = null
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      const result = await parseAnything(entity)

      if (result.type === "npub") {
        router.at("people").of(result.data).replaceModal()
      } else if (result) {
        router.at(entity).replaceModal()
      }

      if (result) {
        stopScanner()
      }
    },
    {
      noTrailing: true,
    },
  )

  let video, scanner

  onDestroy(() => {
    stopScanner()
    searchTerm.set(null)
  })
</script>

{#if scanner}
  {#await scanner}
    <Spinner>Loading your camera...</Spinner>
  {:then}
    <span />
  {/await}
  <div
    class="m-auto rounded border border-solid border-mid bg-dark p-4"
    class:hidden={status !== "ready"}>
    <video class="m-auto rounded" bind:this={video} />
  </div>
{:else}
  <Input autofocus bind:value={$searchTerm}>
    <i slot="before" class="fa fa-search" />
    <i slot="after" class="fa fa-qrcode cursor-pointer" on:click={startScanner} />
  </Input>
  <div class="relative max-h-full">
    <SearchResults replace term={searchTerm}>
      <div slot="result" let:result>
        {#if result.type === "topic"}
          <Card interactive>
            #{result.topic.name}
          </Card>
        {:else if result.type === "profile"}
          <Card interactive>
            <PersonSummary inert hideActions pubkey={result.id} />
          </Card>
        {/if}
      </div>
    </SearchResults>
  </div>
{/if}
