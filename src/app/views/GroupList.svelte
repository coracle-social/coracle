<script lang="ts">
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Media from "src/partials/Media.svelte"
  import Modal from "src/partials/Modal.svelte"
</script>

<div class="flex gap-3">
  <p class="text-2xl font-bold">Groups are going away!</p>
</div>
<p>
  You can still access your groups at <strong>groups.coracle.social</strong>,
  or you can try our new relay-based groups client at <strong>flotilla.social</strong>.
</p>
<div class="flex justify-end gap-2">
  <Anchor external button href="https://groups.coracle.social">Continue to Groups</Anchor>
  <Anchor external button accent href="https://flotilla.social">Try Flotilla</Anchor>
</div>
