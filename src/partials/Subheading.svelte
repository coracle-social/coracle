<script>
  export let icon
</script>

<div class="flex items-center gap-2">
  <i class={`fa {icon} fa-lg`} />
  <h2 class="staatliches text-2xl"><slot /></h2>
</div>
