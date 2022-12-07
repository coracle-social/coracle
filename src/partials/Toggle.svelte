<script>
  import Switch from "svelte-switch"

  export let value

  const onChange = e => {
    value = e.detail.checked
  }
</script>

<Switch
  checked={value}
  on:change={onChange}
  onColor="#ccc"
  offColor="#ccc"
  onHandleColor="#EB5E28"
  handleDiameter={26}
  unCheckedIcon={false}
  boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
  activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
  height={20}
  width={48}>
  <span slot="checkedIcon" />
  <span slot="unCheckedIcon" />
</Switch>
