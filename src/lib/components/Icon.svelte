<style>
  div {
    mask-repeat: none;
    mask-size: 100% 100%;
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {switcher} from "@welshman/lib"
  import AddSquare from "@assets/icons/Add Square.svg?dataurl"
  import AddCircle from "@assets/icons/Add Circle.svg?dataurl"
  import AltArrowRight from "@assets/icons/Alt Arrow Right.svg?dataurl"
  import AltArrowLeft from "@assets/icons/Alt Arrow Left.svg?dataurl"
  import ArrowRight from "@assets/icons/Arrow Right.svg?dataurl"
  import CheckCircle from "@assets/icons/Check Circle.svg?dataurl"
  import ClipboardText from "@assets/icons/Clipboard Text.svg?dataurl"
  import CloseCircle from "@assets/icons/Close Circle.svg?dataurl"
  import Copy from "@assets/icons/Copy.svg?dataurl"
  import Compass from "@assets/icons/Compass.svg?dataurl"
  import CompassBig from "@assets/icons/Compass Big.svg?dataurl"
  import FireMinimalistic from "@assets/icons/Fire Minimalistic.svg?dataurl"
  import GallerySend from "@assets/icons/Gallery Send.svg?dataurl"
  import Ghost from "@assets/icons/Ghost.svg?dataurl"
  import HandPills from "@assets/icons/Hand Pills.svg?dataurl"
  import HomeSmile from "@assets/icons/Home Smile.svg?dataurl"
  import InfoCircle from "@assets/icons/Info Circle.svg?dataurl"
  import LinkRound from "@assets/icons/Link Round.svg?dataurl"
  import Login from "@assets/icons/Login.svg?dataurl"
  import Login2 from "@assets/icons/Login 2.svg?dataurl"
  import Magnifer from "@assets/icons/Magnifer.svg?dataurl"
  import Pallete2 from "@assets/icons/Pallete 2.svg?dataurl"
  import Plain from "@assets/icons/Plain.svg?dataurl"
  import RemoteControllerMinimalistic from "@assets/icons/Remote Controller Minimalistic.svg?dataurl"
  import Settings from "@assets/icons/Settings.svg?dataurl"
  import UFO3 from "@assets/icons/UFO 3.svg?dataurl"
  import UserHeart from "@assets/icons/User Heart.svg?dataurl"
  import UserRounded from "@assets/icons/User Rounded.svg?dataurl"
  import Widget from "@assets/icons/Widget.svg?dataurl"
  import WiFiRouterRound from "@assets/icons/Wi-Fi Router Round.svg?dataurl"

  export let icon
  export let size = 5

  const px = size * 4

  const data = switcher(icon, {
    "add-square": AddSquare,
    "add-circle": AddCircle,
    "alt-arrow-right": AltArrowRight,
    "alt-arrow-left": AltArrowLeft,
    "arrow-right": ArrowRight,
    "check-circle": CheckCircle,
    "clipboard-text": ClipboardText,
    "close-circle": CloseCircle,
    copy: Copy,
    compass: Compass,
    "compass-big": CompassBig,
    "fire-minimalistic": FireMinimalistic,
    "gallery-send": GallerySend,
    "ghost": Ghost,
    "hand-pills": HandPills,
    "home-smile": HomeSmile,
    "info-circle": InfoCircle,
    "link-round": LinkRound,
    "login": Login,
    "login-2": Login2,
    'magnifer': Magnifer,
    'pallete-2': Pallete2,
    plain: Plain,
    'remote-controller-minimalistic': RemoteControllerMinimalistic,
    settings: Settings,
    "ufo-3": UFO3,
    "user-heart": UserHeart,
    "user-rounded": UserRounded,
    "widget": Widget,
    "wifi-router-round": WiFiRouterRound,
  })

  if (!data) {
    throw new Error(`Invalid icon: ${icon}`)
  }
</script>

<div
  class={$$props.class}
  style="mask-image: url({data}); width: {px}px; height: {px}px; min-width: {px}px; min-height: {px}px; background-color: currentcolor;" />
