<script lang="ts">
  import cx from "classnames"
  import {deriveHandleForPubkey, deriveProfile, displayHandle} from "@welshman/app"
  import {isNamecoinIdentifier} from "src/util/namecoin"

  export let pubkey

  const handle = deriveHandleForPubkey(pubkey)
  const profile = deriveProfile(pubkey)

  $: nip05Value = $profile?.nip05 || ""
  $: isNamecoin = nip05Value ? isNamecoinIdentifier(nip05Value) : false
</script>

{#if $handle}
  <div class={cx($$props.class, "flex items-center gap-1 overflow-hidden overflow-ellipsis")}>
    {#if isNamecoin}
      <span
        class="inline-flex shrink-0 items-center gap-1 rounded bg-amber-900/30 px-1 py-0.5 text-xs text-amber-200"
        title="Verified via Namecoin blockchain">
        <i class="fa-solid fa-link text-[10px]" />
        <span class="hidden sm:inline">.bit</span>
      </span>
    {/if}
    <span class="truncate">{displayHandle($handle)}</span>
  </div>
  <slot />
{/if}
