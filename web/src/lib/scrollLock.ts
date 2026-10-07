import { useEffect } from 'react'

let locks = 0
let restore = ''

export const lockScroll = () => {
  if (typeof document === 'undefined') return
  if (locks === 0) {
    restore = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  locks += 1
}

export const unlockScroll = () => {
  if (typeof document === 'undefined' || locks === 0) return
  locks -= 1
  if (locks === 0) document.body.style.overflow = restore
}

export const useScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return
    lockScroll()
    return unlockScroll
  }, [active])
}
