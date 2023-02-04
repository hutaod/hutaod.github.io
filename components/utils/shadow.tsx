// https://gist.github.com/janily/04d7fb0861e053d4679b38743ffc05a7

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  mode: string;
  children: React.ReactNode;
}

export function Shadow(props:Props) {
  const { children, mode, ...rest } = props;
  const nodeRef = useRef(null);
  const shadowAttached = useRef(false);
  const [shadowRoot, setShadowRoot] = useState(null);
  useEffect(() => {
    if (shadowAttached.current || !nodeRef.current) {
      return;
    }
    shadowAttached.current = true;
    setShadowRoot(nodeRef.current.attachShadow({ mode: mode }))
  }, [mode])
  return (
    <div {...rest} ref={nodeRef}>
      {shadowRoot && createPortal(children, shadowRoot)}
    </div>
  )
}
