<script lang="ts">
  import Icon from 'lib/components/Icon.svelte'
  import PrimaryNavItem from 'lib/components/PrimaryNavItem.svelte'
  import {spaces} from 'app/state'
</script>

<div class="w-14 bg-base-100 relative">
  <div class="absolute z-nav-active ml-2 w-12 h-[144px] bg-base-300 -top-[44px]" />
  <div class="flex flex-col justify-between h-full">
    <div>
      <PrimaryNavItem title="Hodlbod">
        <div class="w-10 rounded-full border border-solid border-base-300">
          <img alt="" src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
        </div>
      </PrimaryNavItem>
      {#each $spaces as {id, name, picture} (id)}
        <PrimaryNavItem title={name}>
          <div class="w-10 rounded-full border border-solid border-base-300">
            <img alt={name} src={picture} />
          </div>
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space">
        <div class="w-10 !flex justify-center items-center">
          <Icon size={7} icon="add-circle" />
        </div>
      </PrimaryNavItem>
      <PrimaryNavItem title="Browse Spaces">
        <div class="w-10 !flex justify-center items-center">
          <Icon size={6} icon="compass-big" />
        </div>
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings">
        <div class="w-10 !flex justify-center items-center">
          <Icon size={7} icon="settings" />
        </div>
      </PrimaryNavItem>
    </div>
  </div>
</div>

<style>
  .z-nav-active {
    -webkit-mask-image: url('/nav-active.svg');
    mask-image: url('/nav-active.svg');
  }
</style>
