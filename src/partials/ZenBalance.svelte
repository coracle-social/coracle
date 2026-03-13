<style>
  .zen-icon {
    font-size: 1.2em;
    font-weight: bold;
  }

  .zen-amount {
    font-weight: 600;
  }

  .zen-balance-container :global(.text-accent) {
    color: var(--accent, #10b981);
  }
</style>

<script lang="ts">
  import {_} from "svelte-i18n"
  import {
    extractIdentitiesFromTags,
    checkAllZenBalances,
    checkZenReceivability,
    getApiServerUrl,
    type ZenBalance,
    type ProfileIdentities,
    type ZenReceivability,
  } from "src/util/zen"
  import Popover from "src/partials/Popover.svelte"
  import Link from "src/partials/Link.svelte"

  export let profile: Record<string, any> | null =
    null

  let loading = true
  let balanceData: {
    multipass?: ZenBalance
    g1pub?: ZenBalance
    zencard?: ZenBalance
    usageTokens: number
    propertyTokens: number
  } = {
    usageTokens: 0,
    propertyTokens: 0,
  }
  let identities: ProfileIdentities = {}
  let receivability: ZenReceivability | null = null

  // Extract identities from profile
  $: {
    if (profile) {
      identities = {
        g1pub: profile.g1pub,
        zencard: profile.zencard,
        email: profile.email,
      }

      // Also try to extract from event tags if available
      if (profile.tags) {
        const tagIdentities = extractIdentitiesFromTags(profile.tags)
        identities = {...identities, ...tagIdentities}
      }

      // Check receivability status
      receivability = checkZenReceivability(identities)
    }
  }

  // Fetch balances when identities change
  $: if (identities.g1pub || identities.zencard) {
    fetchBalances()
  }

  async function fetchBalances() {
    loading = true
    try {
      balanceData = await checkAllZenBalances(identities)
    } catch (e) {
      console.error("Failed to fetch ZEN balances:", e)
    } finally {
      loading = false
    }
  }

  // Compute balances for display
  $: usageBalance = balanceData.usageTokens ?? 0
  $: propertyBalance = balanceData.propertyTokens ?? 0
  $: totalBalance = usageBalance + propertyBalance
  $: hasUsageBalance = usageBalance > 0
  $: hasPropertyBalance = propertyBalance > 0
  $: hasAnyBalance = hasUsageBalance || hasPropertyBalance

  // Short address displays
  $: shortG1pub = identities.g1pub
    ? `${identities.g1pub.substring(0, 6)}...${identities.g1pub.substring(identities.g1pub.length - 4)}`
    : null
  $: shortZencard =
    identities.zencard && identities.zencard !== "None"
      ? `${identities.zencard.substring(0, 6)}...${identities.zencard.substring(identities.zencard.length - 4)}`
      : null
</script>

{#if identities.g1pub || identities.zencard}
  <div class="zen-balance-container flex items-center gap-2">
    <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
      <div slot="trigger" class="flex cursor-pointer items-center gap-2">
        <span class="zen-icon text-accent">Z</span>
        {#if loading}
          <span class="animate-pulse text-sm text-neutral-400">...</span>
        {:else if hasAnyBalance}
          <span class="zen-amount font-mono text-accent">
            {totalBalance} ZEN
          </span>
        {:else}
          <span class="text-sm text-neutral-500">--</span>
        {/if}
      </div>

      <div slot="tooltip" class="max-w-sm p-4">
        <div class="mb-3 flex items-center gap-2 font-bold text-accent">
          <span class="text-lg">Z</span>
          {$_("zen.walletStatus")}
        </div>

        <!-- Usage Tokens (MULTIPASS) -->
        <div class="bg-neutral-800/50 border-blue-400 mb-3 rounded border-l-2 p-2">
          <div class="mb-1 flex items-center gap-2">
            <span class="text-blue-400 text-xs font-bold">{$_("zen.usageTokens")}</span>
            <span class="text-xs text-neutral-500">({$_("zen.multipass")})</span>
          </div>
          {#if identities.g1pub}
            <div class="mb-1 font-mono text-xs text-neutral-400">
              {shortG1pub}
            </div>
            {#if loading}
              <div class="animate-pulse text-sm text-neutral-400">{$_("zen.loading")}</div>
            {:else if hasUsageBalance}
              <div class="text-blue-400 text-lg font-bold">
                {usageBalance} ZEN
              </div>
              <div class="text-xs text-neutral-500">
                {$_("zen.usageDesc")}
              </div>
            {:else}
              <div class="text-sm text-neutral-500">0 ZEN</div>
            {/if}
          {:else}
            <div class="text-xs italic text-neutral-500">
              {$_("zen.noMultipass")}
            </div>
          {/if}
        </div>

        <!-- Property Tokens (ZEN Card) -->
        <div class="bg-neutral-800/50 border-green-400 mb-3 rounded border-l-2 p-2">
          <div class="mb-1 flex items-center gap-2">
            <span class="text-green-400 text-xs font-bold">{$_("zen.propertyTokens")}</span>
            <span class="text-xs text-neutral-500">({$_("zen.zenCard")})</span>
          </div>
          {#if identities.zencard && identities.zencard !== "None"}
            <div class="mb-1 font-mono text-xs text-neutral-400">
              {shortZencard}
            </div>
            {#if loading}
              <div class="animate-pulse text-sm text-neutral-400">{$_("zen.loading")}</div>
            {:else if hasPropertyBalance}
              <div class="text-green-400 text-lg font-bold">
                {propertyBalance} ZEN
              </div>
              <div class="text-xs text-neutral-500">
                {$_("zen.propertyDesc")}
              </div>
            {:else}
              <div class="text-sm text-neutral-500">0 ZEN</div>
            {/if}
          {:else}
            <div class="text-xs italic text-neutral-500">
              {$_("zen.noZenCard")}
            </div>
          {/if}
        </div>

        <!-- Receivability Status -->
        {#if receivability}
          <div
            class="mb-3 rounded p-2 {receivability.canReceive
              ? 'bg-green-900/20 border-green-800 border'
              : 'bg-red-900/20 border-red-800 border'}">
            <div class="mb-1 flex items-center gap-2">
              {#if receivability.canReceive}
                <span class="text-green-400">{$_("zen.canReceive")}</span>
              {:else}
                <span class="text-red-400">{$_("zen.cannotReceive")}</span>
              {/if}
            </div>

            {#if !receivability.canReceive && receivability.missingFields.length > 0}
              <div class="mt-1 text-xs text-neutral-400">
                {$_("zen.missing", {
                  values: {fields: receivability.missingFields.slice(0, 2).join(", ")},
                })}
              </div>
            {/if}

            {#if receivability.isFeaturedInUMAP}
              <div class="text-cyan-400 mt-1 flex items-center gap-1 text-xs">
                <span>{$_("zen.geoFeatured")}</span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Like cost info -->
        <div class="border-t border-neutral-700 pt-2 text-xs text-neutral-500">
          <div class="flex items-center gap-1">
            <span>{$_("zen.likeCost", {values: {cost: 1}})}</span>
          </div>
        </div>

        {#if identities.email}
          <Link
            external
            class="mt-3 block text-xs text-accent underline"
            href="{getApiServerUrl()}/check_zencard?email={identities.email}">
            {$_("zen.checkWallet")}
          </Link>
        {/if}
      </div>
    </Popover>
  </div>
{:else}
  <!-- No wallet info available -->
  <div class="zen-balance-container flex items-center gap-2 opacity-50">
    <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
      <div slot="trigger" class="flex cursor-pointer items-center gap-2">
        <span class="zen-icon text-neutral-500">Z</span>
        <span class="text-sm text-neutral-500">--</span>
      </div>
      <div slot="tooltip" class="max-w-xs p-3 text-sm">
        <div class="mb-2 text-neutral-400">
          <strong>{$_("zen.noWallet")}</strong>
        </div>
        <div class="text-xs text-neutral-500">
          {$_("zen.noWalletDescription")}
        </div>
        <div class="mt-2 text-xs text-neutral-500">
          {$_("zen.missingFields")}
          <ul class="mt-1 list-inside list-disc">
            <li>g1pub ({$_("zen.multipass")})</li>
            <li>zencard ({$_("zen.zenCard")})</li>
          </ul>
        </div>
      </div>
    </Popover>
  </div>
{/if}
