<script lang="ts">
  import Icon from 'lib/components/Icon.svelte'
  import SecondaryNavItem from 'lib/components/SecondaryNavItem.svelte'
</script>

<div class="w-60 bg-base-300 flex flex-col gap-1 px-2 py-4">
  <SecondaryNavItem href="/">
    <Icon icon="home-smile" /> Home
  </SecondaryNavItem>
  <SecondaryNavItem href="/friends">
    <Icon icon="user-heart" /> Friends
  </SecondaryNavItem>
  <SecondaryNavItem href="/notes">
    <Icon icon="clipboard-text" /> Saved Notes
  </SecondaryNavItem>
  <div class="uppercase text-sm font-bold flex justify-between items-center text-stark-content px-4 py-2">
    Conversations
    <div class="cursor-pointer">
      <Icon icon="add-circle" class="bg-stark-content" />
    </div>
  </div>
</div>

