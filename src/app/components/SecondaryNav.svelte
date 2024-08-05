<script lang="ts">
  import Icon from "lib/components/Icon.svelte"
  import SecondaryNavItem from "lib/components/SecondaryNavItem.svelte"
</script>

<div class="flex w-60 flex-col gap-1 bg-base-300 px-2 py-4">
  <SecondaryNavItem href="/">
    <Icon icon="home-smile" /> Home
  </SecondaryNavItem>
  <SecondaryNavItem href="/friends">
    <Icon icon="user-heart" /> Friends
  </SecondaryNavItem>
  <SecondaryNavItem href="/notes">
    <Icon icon="clipboard-text" /> Saved Notes
  </SecondaryNavItem>
  <div
    class="text-stark-content flex items-center justify-between px-4 py-2 text-sm font-bold uppercase">
    Conversations
    <div class="cursor-pointer">
      <Icon icon="add-circle" class="bg-stark-content" />
    </div>
  </div>
</div>
