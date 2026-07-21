import { onBeforeUnmount, onMounted } from 'vue'

const pageScrollLockClass = 'app-scroll-locked'
export const pageScrollLockEventName = 'app-overlay-scroll-lock'
let pageScrollLockCount = 0

export function usePageScrollLock() {
  let ownsScrollLock = false

  function getScrollbarWidth() {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
  }

  function setLocked(locked: boolean) {
    if (locked) {
      document.documentElement.style.setProperty(
        '--app-scroll-lock-gutter',
        `${getScrollbarWidth()}px`,
      )
    } else {
      document.documentElement.style.removeProperty('--app-scroll-lock-gutter')
    }

    document.documentElement.classList.toggle(pageScrollLockClass, locked)
    document.body.classList.toggle(pageScrollLockClass, locked)
    window.dispatchEvent(new CustomEvent(pageScrollLockEventName, { detail: { locked } }))
  }

  onMounted(() => {
    ownsScrollLock = true
    pageScrollLockCount += 1

    if (pageScrollLockCount === 1) {
      setLocked(true)
    }
  })

  onBeforeUnmount(() => {
    if (!ownsScrollLock) return

    ownsScrollLock = false
    pageScrollLockCount = Math.max(0, pageScrollLockCount - 1)

    if (pageScrollLockCount === 0) {
      setLocked(false)
    }
  })
}
