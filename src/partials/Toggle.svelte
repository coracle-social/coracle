<script lang="ts">
  import Switch from "svelte-switch"
  import {createEventDispatcher} from "svelte"
  import {themeColors} from "src/partials/state"

  export let value
  export let disabled = false
  export let scale = 1

  const dispatch = createEventDispatcher()

  const onChange = e => {
    value = e.detail.checked
    dispatch("change", value)
  }
</script>

<Switch
  {disabled}
  checked={value}
  on:change={onChange}
  onColor={$themeColors['neutral-700']}
  offColor={$themeColors['neutral-700']}
  onHandleColor={$themeColors.accent}
  handleDiameter={Math.round(20 * scale)}
  unCheckedIcon={false}
  boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
  activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
  height={Math.round(20 * scale)}
  width={Math.round(36 * scale)}>
  <span slot="checkedIcon" />
  <span slot="unCheckedIcon" />
</Switch>
