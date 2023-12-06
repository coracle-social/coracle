<script lang="ts">
  import cx from "classnames"
  import {tryFunc} from "hurdak"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import {isHex} from "src/util/nostr"
  import Scan from "src/app/Scan.svelte"
  import Search from "src/app/Search.svelte"
  import {router} from "src/app/router"
  import {
    loadPeople,
  } from "src/engine"

  let inputIsOpen = false
  let mode

  const setMode = m => {
    mode = m
  }

  const showInput = () => {
    inputIsOpen = true
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
        mode = null
      } else if (entity.includes("@")) {
        let profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).open()
          mode = null
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).open()
          mode = null
        })
      }
    },
    {
      noTrailing: true,
    }
  )

  const onSearch = e => {
    if (e.detail.length < 30) {
      loadPeople(e.detail)
    } else if (e.detail) {
      tryParseEntity(e.detail)
    }
  }

  const onScan = e => {
    tryParseEntity(e.detail)
  }
</script>

<div class="search-input">
  <div
    class="border-2 border-solid border-warm text-accent rounded-full w-10 h-10 pl-3 pt-2 p-1 cursor-pointer"
    on:click={showInput}>
    <i class="fa fa-search scale-150" />
  </div>
  <Search
    on:search={onSearch}
    isOpen={mode === "search"}
    on:click={() => setMode('search')}
    on:close={() => setMode(null)} />
  <Scan
    on:scan={onScan}
    isOpen={mode === "scan"}
    on:click={() => setMode('scan')}
    on:close={() => setMode(null)} />
</div>
