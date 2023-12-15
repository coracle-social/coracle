<script lang="ts">
  import cx from 'classnames'
  import Card from "src/partials/Card.svelte"
</script>

<Card class={cx($$props.class, "overflow-hidden shadow-lg border border-solid border-mid")}>
  <div class="-mx-3 -mt-1">
    <slot />
  </div>
</Card>
