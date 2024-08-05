<style>
  .z-nav-active {
    -webkit-mask-image: url("/nav-active.svg");
    mask-image: url("/nav-active.svg");
  }
</style>

<script lang="ts">
  import Icon from "lib/components/Icon.svelte"
  import PrimaryNavItem from "lib/components/PrimaryNavItem.svelte"
  import {spaces} from "app/state"
</script>

<div class="relative w-14 bg-base-100">
  <div class="absolute -top-[44px] z-nav-active ml-2 h-[144px] w-12 bg-base-300" />
  <div class="flex h-full flex-col justify-between">
    <div>
      <PrimaryNavItem title="Hodlbod">
        <div class="w-10 rounded-full border border-solid border-base-300">
          <img
            alt=""
            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
        </div>
      </PrimaryNavItem>
      {#each $spaces as { id, name, picture } (id)}
        <PrimaryNavItem title={name}>
          <div class="w-10 rounded-full border border-solid border-base-300">
            <img alt={name} src={picture} />
          </div>
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="add-circle" />
        </div>
      </PrimaryNavItem>
      <PrimaryNavItem title="Browse Spaces">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={6} icon="compass-big" />
        </div>
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="settings" />
        </div>
      </PrimaryNavItem>
    </div>
  </div>
</div>
