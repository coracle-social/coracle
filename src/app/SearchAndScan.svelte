<script lang="ts">
  import {tryFunc} from "hurdak"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import {isHex} from "src/util/nostr"
  import Modal from "src/partials/Modal.svelte"
  import Input from "src/partials/Input.svelte"
  import Scan from "src/app/Scan.svelte"
  import SearchResults from "src/app/SearchResults.svelte"
  import {router} from "src/app/router"
  import {searchTerm} from "src/app/state"

  let scanning = false
  let innerWidth = 0

  const closeSearch = () => searchTerm.set(null)

  const startScanner = () => {
    scanning = true
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      entity = fromNostrURI(entity)

      if (entity.length < 5) {
        return
      }

      if (isHex(entity)) {
        router.at("people").of(entity).open()
        scanning = false
      } else if (entity.includes("@")) {
        let profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).open()
          scanning = false
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).open()
          scanning = false
        })
      }
    },
    {
      noTrailing: true,
    },
  )

  $: {
    if ($searchTerm?.length > 30) {
      tryParseEntity($searchTerm)
    }
  }

  const onScan = e => {
    tryParseEntity(e.detail)
  }
</script>

<svelte:window bind:innerWidth />

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      closeSearch()
    }
  }} />

{#if $searchTerm !== null}
  <Modal onEscape={closeSearch}>
    {#if scanning}
      <Scan {onScan} />
    {:else}
      <SearchResults onClose={closeSearch} term={$searchTerm} />
    {/if}
    {#if innerWidth < 1024}
      <div
        class="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t border-solid border-mid bg-dark px-3 py-2">
        <div class="flex-grow">
          <Input autofocus bind:value={$searchTerm}>
            <i slot="before" class="fa fa-search" />
            <i slot="after" class="fa fa-qrcode cursor-pointer" on:click={startScanner} />
          </Input>
        </div>
        <i class="fa fa-times fa-2xl cursor-pointer" on:click={closeSearch} />
      </div>
    {/if}
  </Modal>
{/if}
