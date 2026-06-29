import { onBeforeUnmount, onMounted } from 'vue'

export const pageScrollLockClass = 'app-scroll-locked'
export const pageScrollLockEventName = 'app-overlay-scroll-lock'

export function usePageScrollLock() {
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
    setLocked(true)
  })

  onBeforeUnmount(() => {
    setLocked(false)
  })
}
