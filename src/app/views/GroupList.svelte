<script lang="ts">
  import Link from "src/partials/Link.svelte"
</script>

<div class="flex gap-3">
  <p class="text-2xl font-bold">Groups are going away!</p>
</div>
<p>
  You can still access your groups at <strong>groups.coracle.social</strong>, or you can try our new
  relay-based groups client at <strong>flotilla.social</strong>.
</p>
<div class="flex justify-end gap-2">
  <Link external class="btn" href="https://groups.coracle.social">Continue to Groups</Link>
  <Link external class="btn btn-accent" href="https://flotilla.social">Try Flotilla</Link>
</div>
