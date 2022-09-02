import { useUserStore } from '@/store/user'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import db from '@/store/db'
import assets from '@/service/assets'
import blockchain from '@/service/blockchain'

export const useIndex = () => {
  const { t: $t } = useI18n()
  const router = useRouter()

  const showReceive = ref(false)
  const userStore = useUserStore()
  const guardians = ref([] as string[])
  const address = ref('')
  const addressQRCode = ref('')

  const initQRCode = async (block: string) => {
    if (!block) {
      return
    }
    // https://www.npmjs.com/package/qrcode#example-1
    addressQRCode.value = await QRCode.toDataURL(block, {
      type: 'image/png',
      width: 160,
      margin: 0,
      // errorCorrectionLevel: 'L',
      color: {
        dark: '#000000',
        light: '#FFFFFF00',
      },
    })
  }
  const sendCoin = (i: number) => {
    const coin = userStore.coins[i]
    router.push({
      path: '/send',
      query: {
        symbol: coin.symbol,
      },
    })
  }
  const cameraElement = ref({} as HTMLVideoElement)
  const scan = reactive({
    isScanning: false,
    cameraAll: 0,
    cameraCount: 0,
    frameId: 0,
  })
  const scanStart = async () => {
    if (scan.isScanning) {
      return
    }
    scan.isScanning = true
    scan.cameraAll = 0
    scan.cameraCount = 0
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      if (!stream) {
        ElMessage.error('no source found')
        return
      }

      const camera = cameraElement.value as HTMLVideoElement
      const canvas = document.createElement('canvas')
      const requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame

      camera.srcObject = stream
      camera.play()

      const arr = [] as string[]
      const tick = () => {
        if (!scan.isScanning) {
          scanStop()
          return
        }
        if (camera.readyState === camera.HAVE_ENOUGH_DATA && canvas) {
          canvas.width = camera.videoWidth
          canvas.height = camera.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const rect = [0, 0, canvas.width, canvas.height]
            ctx.drawImage(camera, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, rect[2], rect[3], {
              inversionAttempts: 'dontInvert',
            })
            if (code) {
              const s = code.data
              const data = s.slice(s.indexOf(':') + 1)
              const info = s.slice(0, s.indexOf(':'))
              const index = info.split('#')[0]
              const all = Number(info.split('#')[1])
              if (!arr[index] && !Number.isNaN(all)) {
                scan.cameraAll = all
                scan.cameraCount += 1
                arr[index] = data
              }
              let ok = true
              for (let i = 0; i < arr.length; i++) {
                if (arr.length === all && arr[i]) {
                  //
                } else {
                  ok = false
                  break
                }
              }
              if (ok) {
                try {
                  const url = new URL(arr.join(''))
                  camera.pause()
                  scanStop()
                  if (url.host === window.location.host) {
                    router.push(url.pathname + url.search)
                  } else {
                    ElMessage.warning('location host different')
                  }
                } catch (error) {
                  //
                }
              }
            }
          }
        }
        scan.frameId = requestAnimationFrame(tick)
      }
      scan.frameId = requestAnimationFrame(tick)
    } catch (err) {
      ElMessage.error('scan open failed')
    }
  }
  const scanStop = () => {
    if (!scan.isScanning) {
      return
    }
    scan.isScanning = false
    const camera = cameraElement.value as any
    camera.pause()
    if (scan.frameId) {
      const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
      cancelAnimationFrame(scan.frameId)
      scan.frameId = 0
    }
    camera.srcObject.getTracks().forEach((track: any) => track.stop())
    camera.srcObject = null
  }
  const userExit = () => {
    ElMessageBox.confirm($t('SureLogOut'), $t('LogOutAccount'), {
      confirmButtonText: $t('LogOut'),
      cancelButtonText: $t('Cancel'),
    })
      .then(() => {
        userStore.exit(true)
      })
      .catch(() => {})
  }

  onUnmounted(() => {
    scanStop()
  })

  const init = async () => {
    const users = await db.getUsers()
    const email = window.localStorage.getItem('email')
    if (email) {
      const user = users.find((e) => e.email === email)
      if (user) {
        // check login
        // if (dayjs.unix(user.sessionKey.expires).isAfter(dayjs())) {
        const resKeysetHash = await blockchain.getAccountKeysetHash(user.account)
        if (resKeysetHash === user.keyset.hash) {
          address.value = user.account
          userStore.update(user)
          initQRCode(user.account)
          guardians.value = user.keyset.recoveryEmails.emails
          const coins = await assets.getAddressAssest(user.account)
          console.log('coins', coins)
          userStore.coins = coins
          return
        }
        // }
      }
    }
    userStore.exit()
  }

  init()
  return {
    guardians,
    cameraElement,
    addressQRCode,
    address,
    scan,
    scanStart,
    scanStop,
    showReceive,
    sendCoin,
    userStore,
    userExit,
  }
}
