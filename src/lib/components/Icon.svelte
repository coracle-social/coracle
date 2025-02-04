<style>
  div {
    mask-repeat: none;
    mask-size: 100% 100%;
  }
</style>

<script lang="ts">
  import {switcher} from "@welshman/lib"
  import AddSquare from "@assets/icons/Add Square.svg?dataurl"
  import ArrowsALogout2 from "@assets/icons/Arrows ALogout 2.svg?dataurl"
  import Code2 from "@assets/icons/Code 2.svg?dataurl"
  import Document from "@assets/icons/Document.svg?dataurl"
  import Earth from "@assets/icons/Earth.svg?dataurl"
  import Pen from "@assets/icons/Pen.svg?dataurl"
  import PenNewSquare from "@assets/icons/Pen New Square.svg?dataurl"
  import HeadphonesRound from "@assets/icons/Headphones Round.svg?dataurl"
  import AddCircle from "@assets/icons/Add Circle.svg?dataurl"
  import AltArrowDown from "@assets/icons/Alt Arrow Down.svg?dataurl"
  import AltArrowRight from "@assets/icons/Alt Arrow Right.svg?dataurl"
  import AltArrowUp from "@assets/icons/Alt Arrow Up.svg?dataurl"
  import AltArrowLeft from "@assets/icons/Alt Arrow Left.svg?dataurl"
  import ArrowRight from "@assets/icons/Arrow Right.svg?dataurl"
  import Bag from "@assets/icons/Bag.svg?dataurl"
  import Bolt from "@assets/icons/Bolt.svg?dataurl"
  import CalendarAdd from "@assets/icons/Calendar Add.svg?dataurl"
  import CalendarMinimalistic from "@assets/icons/Calendar Minimalistic.svg?dataurl"
  import ChatRound from "@assets/icons/Chat Round.svg?dataurl"
  import CheckCircle from "@assets/icons/Check Circle.svg?dataurl"
  import ClipboardText from "@assets/icons/Clipboard Text.svg?dataurl"
  import ClockCircle from "@assets/icons/Clock Circle.svg?dataurl"
  import CloseCircle from "@assets/icons/Close Circle.svg?dataurl"
  import Copy from "@assets/icons/Copy.svg?dataurl"
  import Compass from "@assets/icons/Compass.svg?dataurl"
  import CompassBig from "@assets/icons/Compass Big.svg?dataurl"
  import CPU from "@assets/icons/CPU.svg?dataurl"
  import Danger from "@assets/icons/Danger.svg?dataurl"
  import Exit from "@assets/icons/Exit.svg?dataurl"
  import File from "@assets/icons/File.svg?dataurl"
  import FireMinimalistic from "@assets/icons/Fire Minimalistic.svg?dataurl"
  import GallerySend from "@assets/icons/Gallery Send.svg?dataurl"
  import Ghost from "@assets/icons/Ghost.svg?dataurl"
  import Hashtag from "@assets/icons/Hashtag.svg?dataurl"
  import HandPills from "@assets/icons/Hand Pills.svg?dataurl"
  import HomeSmile from "@assets/icons/Home Smile.svg?dataurl"
  import Inbox from "@assets/icons/Inbox.svg?dataurl"
  import InfoCircle from "@assets/icons/Info Circle.svg?dataurl"
  import InfoSquare from "@assets/icons/Info Square.svg?dataurl"
  import Key from "@assets/icons/Key.svg?dataurl"
  import KeyMinimalisticSquare3 from "@assets/icons/Key Minimalistic Square 3.svg?dataurl"
  import Letter from "@assets/icons/Letter.svg?dataurl"
  import LinkRound from "@assets/icons/Link Round.svg?dataurl"
  import Lock from "@assets/icons/Lock.svg?dataurl"
  import Login from "@assets/icons/Login.svg?dataurl"
  import Login2 from "@assets/icons/Login 2.svg?dataurl"
  import Magnifer from "@assets/icons/Magnifer.svg?dataurl"
  import Mailbox from "@assets/icons/Mailbox.svg?dataurl"
  import MapPoint from "@assets/icons/Map Point.svg?dataurl"
  import MenuDots from "@assets/icons/Menu Dots.svg?dataurl"
  import NotesMinimalistic from "@assets/icons/Notes Minimalistic.svg?dataurl"
  import Pallete2 from "@assets/icons/Pallete 2.svg?dataurl"
  import Paperclip from "@assets/icons/Paperclip.svg?dataurl"
  import Plain from "@assets/icons/Plain.svg?dataurl"
  import QuestionSquare from "@assets/icons/Question Square.svg?dataurl"
  import RemoteControllerMinimalistic from "@assets/icons/Remote Controller Minimalistic.svg?dataurl"
  import Rocket2 from "@assets/icons/Rocket 2.svg?dataurl"
  import Reply from "@assets/icons/Reply.svg?dataurl"
  import Server from "@assets/icons/Server.svg?dataurl"
  import Settings from "@assets/icons/Settings.svg?dataurl"
  import SettingsMinimalistic from "@assets/icons/Settings Minimalistic.svg?dataurl"
  import TagHorizontal from "@assets/icons/Tag Horizontal.svg?dataurl"
  import ShareCircle from "@assets/icons/Share Circle.svg?dataurl"
  import ShopMinimalistic from "@assets/icons/Shop Minimalistic.svg?dataurl"
  import SmileCircle from "@assets/icons/Smile Circle.svg?dataurl"
  import SquareShareLine from "@assets/icons/Square Share Line.svg?dataurl"
  import SortVertical from "@assets/icons/Sort Vertical.svg?dataurl"
  import TrashBin2 from "@assets/icons/Trash Bin 2.svg?dataurl"
  import UFO3 from "@assets/icons/UFO 3.svg?dataurl"
  import UserHeart from "@assets/icons/User Heart.svg?dataurl"
  import UserCircle from "@assets/icons/User Circle.svg?dataurl"
  import UserRounded from "@assets/icons/User Rounded.svg?dataurl"
  import Widget from "@assets/icons/Widget.svg?dataurl"
  import WidgetAdd from "@assets/icons/Widget Add.svg?dataurl"
  import WiFiRouterRound from "@assets/icons/Wi-Fi Router Round.svg?dataurl"

  const {
    icon,
    size = 5,
    ...restProps
  }: {
    icon: string
    size?: number
    class?: string
  } = $props()

  const px = size * 4

  const data = switcher(icon, {
    "add-square": AddSquare,
    "arrows-a-logout-2": ArrowsALogout2,
    "code-2": Code2,
    document: Document,
    earth: Earth,
    pen: Pen,
    "pen-new-square": PenNewSquare,
    "headphones-round": HeadphonesRound,
    "add-circle": AddCircle,
    "alt-arrow-down": AltArrowDown,
    "alt-arrow-right": AltArrowRight,
    "alt-arrow-up": AltArrowUp,
    "alt-arrow-left": AltArrowLeft,
    "arrow-right": ArrowRight,
    bag: Bag,
    bolt: Bolt,
    "calendar-add": CalendarAdd,
    "calendar-minimalistic": CalendarMinimalistic,
    "chat-round": ChatRound,
    "check-circle": CheckCircle,
    "clipboard-text": ClipboardText,
    "clock-circle": ClockCircle,
    "close-circle": CloseCircle,
    copy: Copy,
    compass: Compass,
    "compass-big": CompassBig,
    cpu: CPU,
    danger: Danger,
    exit: Exit,
    file: File,
    "fire-minimalistic": FireMinimalistic,
    "gallery-send": GallerySend,
    ghost: Ghost,
    hashtag: Hashtag,
    "hand-pills": HandPills,
    "home-smile": HomeSmile,
    inbox: Inbox,
    "info-circle": InfoCircle,
    "info-square": InfoSquare,
    key: Key,
    "key-minimalistic-square-3": KeyMinimalisticSquare3,
    letter: Letter,
    "link-round": LinkRound,
    login: Login,
    lock: Lock,
    "login-2": Login2,
    magnifer: Magnifer,
    mailbox: Mailbox,
    "map-point": MapPoint,
    "menu-dots": MenuDots,
    "notes-minimalistic": NotesMinimalistic,
    "pallete-2": Pallete2,
    paperclip: Paperclip,
    plain: Plain,
    "question-square": QuestionSquare,
    reply: Reply,
    "remote-controller-minimalistic": RemoteControllerMinimalistic,
    "rocket-2": Rocket2,
    "share-circle": ShareCircle,
    "shop-minimalistic": ShopMinimalistic,
    "smile-circle": SmileCircle,
    server: Server,
    settings: Settings,
    "settings-minimalistic": SettingsMinimalistic,
    "tag-horizontal": TagHorizontal,
    "trash-bin-2": TrashBin2,
    "ufo-3": UFO3,
    "square-share-line": SquareShareLine,
    "sort-vertical": SortVertical,
    "user-heart": UserHeart,
    "user-circle": UserCircle,
    "user-rounded": UserRounded,
    widget: Widget,
    "widget-add": WidgetAdd,
    "wifi-router-round": WiFiRouterRound,
  })

  if (!data) {
    throw new Error(`Invalid icon: ${icon}`)
  }
</script>

<div
  class="inline-block {restProps.class}"
  style="mask-image: url({data}); width: {px}px; height: {px}px; min-width: {px}px; min-height: {px}px; background-color: currentcolor;">
</div>
