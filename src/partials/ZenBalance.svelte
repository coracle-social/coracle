<script lang="ts">
  import {onMount} from 'svelte'
  import {derived, writable} from 'svelte/store'
  import {
    createZenBalanceStore, 
    extractIdentitiesFromTags, 
    checkAllZenBalances, 
    checkZenReceivability,
    formatZen, 
    getApiServerUrl,
    getTokenTypeLabel,
    getTokenTypeDescription,
    type ZenBalance, 
    type ProfileIdentities,
    type ZenReceivability,
  } from 'src/util/zen'
  import {t, currentLocale} from 'src/util/translations'
  import Popover from 'src/partials/Popover.svelte'
  import Link from 'src/partials/Link.svelte'
  import Icon from 'src/partials/Icon.svelte'
  
  export let pubkey: string
  export let profile: {g1pub?: string; zencard?: string; email?: string; tags?: string[][]} | null = null
  export let compact = false
  
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
      console.error('Failed to fetch ZEN balances:', e)
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
  $: shortG1pub = identities.g1pub ? 
    `${identities.g1pub.substring(0, 6)}...${identities.g1pub.substring(identities.g1pub.length - 4)}` : 
    null
  $: shortZencard = identities.zencard && identities.zencard !== 'None' ? 
    `${identities.zencard.substring(0, 6)}...${identities.zencard.substring(identities.zencard.length - 4)}` : 
    null
  
  // Current locale for translations
  $: locale = $currentLocale || 'en'
</script>

{#if identities.g1pub || identities.zencard}
  <div class="zen-balance-container flex items-center gap-2">
    <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
      <div slot="trigger" class="flex items-center gap-2 cursor-pointer">
        <span class="zen-icon text-accent">Ẑ</span>
        {#if loading}
          <span class="text-neutral-400 text-sm animate-pulse">...</span>
        {:else if hasAnyBalance}
          <span class="zen-amount font-mono text-accent">
            {totalBalance} ẐEN
          </span>
        {:else}
          <span class="text-neutral-500 text-sm">--</span>
        {/if}
      </div>
      
      <div slot="tooltip" class="p-4 max-w-sm">
        <div class="font-bold mb-3 text-accent flex items-center gap-2">
          <span class="text-lg">Ẑ</span>
          ẐEN Wallet Status
        </div>
        
        <!-- Usage Tokens (MULTIPASS) -->
        <div class="mb-3 p-2 rounded bg-neutral-800/50 border-l-2 border-blue-400">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-blue-400 text-xs font-bold">⚡ USAGE TOKENS</span>
            <span class="text-xs text-neutral-500">(MULTIPASS)</span>
          </div>
          {#if identities.g1pub}
            <div class="text-xs text-neutral-400 mb-1 font-mono">
              {shortG1pub}
            </div>
            {#if loading}
              <div class="text-neutral-400 text-sm animate-pulse">Loading...</div>
            {:else if hasUsageBalance}
              <div class="text-lg font-bold text-blue-400">
                {usageBalance} ẐEN
              </div>
              <div class="text-xs text-neutral-500">
                {getTokenTypeDescription('usage', locale)}
              </div>
            {:else}
              <div class="text-neutral-500 text-sm">0 ẐEN</div>
            {/if}
          {:else}
            <div class="text-neutral-500 text-xs italic">
              No MULTIPASS configured
            </div>
          {/if}
        </div>
        
        <!-- Property Tokens (ZEN Card) -->
        <div class="mb-3 p-2 rounded bg-neutral-800/50 border-l-2 border-green-400">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-green-400 text-xs font-bold">🏛️ PROPERTY TOKENS</span>
            <span class="text-xs text-neutral-500">(ZEN Card)</span>
          </div>
          {#if identities.zencard && identities.zencard !== 'None'}
            <div class="text-xs text-neutral-400 mb-1 font-mono">
              {shortZencard}
            </div>
            {#if loading}
              <div class="text-neutral-400 text-sm animate-pulse">Loading...</div>
            {:else if hasPropertyBalance}
              <div class="text-lg font-bold text-green-400">
                {propertyBalance} ẐEN
              </div>
              <div class="text-xs text-neutral-500">
                {getTokenTypeDescription('property', locale)}
              </div>
            {:else}
              <div class="text-neutral-500 text-sm">0 ẐEN</div>
            {/if}
          {:else}
            <div class="text-neutral-500 text-xs italic">
              No ZEN Card configured
            </div>
          {/if}
        </div>
        
        <!-- Receivability Status -->
        {#if receivability}
          <div class="mb-3 p-2 rounded {receivability.canReceive ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}">
            <div class="flex items-center gap-2 mb-1">
              {#if receivability.canReceive}
                <span class="text-green-400">✓</span>
                <span class="text-green-400 text-sm font-bold">Can receive ẐEN</span>
              {:else}
                <span class="text-red-400">✗</span>
                <span class="text-red-400 text-sm font-bold">Cannot receive ẐEN</span>
              {/if}
            </div>
            
            {#if !receivability.canReceive && receivability.missingFields.length > 0}
              <div class="text-xs text-neutral-400 mt-1">
                Missing: {receivability.missingFields.slice(0, 2).join(', ')}
              </div>
            {/if}
            
            {#if receivability.isFeaturedInUMAP}
              <div class="flex items-center gap-1 mt-1 text-xs text-cyan-400">
                <span>📍</span>
                <span>Geo-messages featured in UMAP</span>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Like cost info -->
        <div class="pt-2 border-t border-neutral-700 text-xs text-neutral-500">
          <div class="flex items-center gap-1">
            <Icon icon="heart" class="w-3 h-3" />
            <span>Liking costs 1 ẐEN (transferred to author)</span>
          </div>
        </div>
        
        {#if identities.email}
          <Link 
            external 
            class="mt-3 block text-xs text-accent underline"
            href="{getApiServerUrl()}/check_zencard?email={identities.email}">
            Check full wallet details →
          </Link>
        {/if}
      </div>
    </Popover>
  </div>
{:else}
  <!-- No wallet info available -->
  <div class="zen-balance-container flex items-center gap-2 opacity-50">
    <Popover triggerType="mouseenter" opts={{hideOnClick: true}}>
      <div slot="trigger" class="flex items-center gap-2 cursor-pointer">
        <span class="zen-icon text-neutral-500">Ẑ</span>
        <span class="text-neutral-500 text-sm">--</span>
      </div>
      <div slot="tooltip" class="p-3 max-w-xs text-sm">
        <div class="text-neutral-400 mb-2">
          <strong>No ẐEN wallet configured</strong>
        </div>
        <div class="text-neutral-500 text-xs">
          This user has not set up their MULTIPASS or ZEN Card.
          They cannot receive ẐEN from likes.
        </div>
        <div class="text-neutral-500 text-xs mt-2">
          Missing fields:
          <ul class="list-disc list-inside mt-1">
            <li>g1pub (MULTIPASS)</li>
            <li>zencard (ZEN Card)</li>
          </ul>
        </div>
      </div>
    </Popover>
  </div>
{/if}

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

