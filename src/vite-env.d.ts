/// <reference types="vite/client" />

import type React from 'react'

declare global {
  type StyleSheetCSS = Record<string, React.CSSProperties>

  interface WindowAppProps {
    onClose: () => void
    onInteract: () => void
    onMinimize: () => void
  }

  type DesktopWindows = Record<
    string,
    {
      zIndex: number
      minimized: boolean
      component: JSX.Element
      name: string
      icon: import('./os/assets/icons').IconName
    }
  >

}

declare module '*.glsl' {
  const source: string
  export default source
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.pdf' {
  const src: string
  export default src
}

export {}
