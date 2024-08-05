<script lang="ts">
  import cx from 'classnames'
  import {switcher} from '@welshman/lib'
  import AddSquare from 'assets/icons/Add Square.svg?dataurl'
  import AddCircle from 'assets/icons/Add Circle.svg?dataurl'
  import AltArrowRight from 'assets/icons/Alt Arrow Right.svg?dataurl'
  import ClipboardText from 'assets/icons/Clipboard Text.svg?dataurl'
  import Compass from 'assets/icons/Compass.svg?dataurl'
  import CompassBig from 'assets/icons/Compass Big.svg?dataurl'
  import HandPills from 'assets/icons/Hand Pills.svg?dataurl'
  import HomeSmile from 'assets/icons/Home Smile.svg?dataurl'
  import Plain from 'assets/icons/Plain.svg?dataurl'
  import Settings from 'assets/icons/Settings.svg?dataurl'
  import UFO3 from 'assets/icons/UFO 3.svg?dataurl'
  import UserHeart from 'assets/icons/User Heart.svg?dataurl'

  export let icon
  export let size = 5

  const px = size * 4

  const data = switcher(icon, {
    'add-square': AddSquare,
    'add-circle': AddCircle,
    'alt-arrow-right': AltArrowRight,
    'clipboard-text': ClipboardText,
    'compass': Compass,
    'compass-big': CompassBig,
    'hand-pills': HandPills,
    'home-smile': HomeSmile,
    'plain': Plain,
    'settings': Settings,
    'ufo-3': UFO3,
    'user-heart': UserHeart,
  })

  if (!data) {
    throw new Error(`Invalid icon: ${icon}`)
  }
</script>

<div
  class={cx($$props.class, "bg-base-content")}
  style="mask-image: url({data}); width: {px}px; height: {px}px; min-width: {px}px; min-height: {px}px;" />

<style>
  div {
    mask-repeat: none;
    mask-size: 100% 100%;
  }
</style>
