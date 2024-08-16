<script lang="ts">
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import SecondaryNav from "@lib/components/SecondaryNav.svelte"
  import SecondaryNavItem from "@lib/components/SecondaryNavItem.svelte"
  import SecondaryNavSection from "@lib/components/SecondaryNavSection.svelte"
</script>

<SecondaryNav>
  <SecondaryNavSection>
    <div in:fly>
      <SecondaryNavItem href="/spaces">
        <Icon icon="widget" /> Spaces
      </SecondaryNavItem>
    </div>
    <div in:fly={{delay: 50}}>
      <SecondaryNavItem href="/themes">
        <Icon icon="pallete-2" /> Themes
      </SecondaryNavItem>
    </div>
  </SecondaryNavSection>
</SecondaryNav>

<Page>
  <slot />
</Page>
