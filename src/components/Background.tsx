import { useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import backgroundShader from './Background.frag?raw'
import flowShader from './Flow.frag?raw'

const VERTEX_SHADER =
  'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }'

// The image is soft by nature, so it renders small and scales up cleanly
const RESOLUTION_SCALE = 0.5

// The flow is smoother still, so it is simulated on a coarser grid than the image
const FLOW_SCALE = 0.5

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isHome = useLocation({
    select: (location) => location.pathname === '/',
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2')
    if (!canvas || !gl) return
    // The flow holds signed fractions, which need a float texture to render into
    if (
      !gl.getExtension('EXT_color_buffer_float') &&
      !gl.getExtension('EXT_color_buffer_half_float')
    )
      return

    const link = (fragmentShader: string) => {
      const program = gl.createProgram()
      for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX_SHADER],
        [gl.FRAGMENT_SHADER, fragmentShader],
      ] as const) {
        const shader = gl.createShader(type)
        if (!shader) return null
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        gl.attachShader(program, shader)
      }
      gl.bindAttribLocation(program, 0, 'position')
      gl.linkProgram(program)
      return program
    }
    const background = link(backgroundShader)
    const flow = link(flowShader)
    if (!background || !flow) return

    // One triangle that covers the whole canvas
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const backgroundResolution = gl.getUniformLocation(
      background,
      'u_resolution',
    )
    const backgroundTime = gl.getUniformLocation(background, 'u_time')
    const flowResolution = gl.getUniformLocation(flow, 'u_resolution')
    const flowElapsed = gl.getUniformLocation(flow, 'u_elapsed')
    const flowPointer = gl.getUniformLocation(flow, 'u_pointer')
    const flowPrevious = gl.getUniformLocation(flow, 'u_previous')
    const flowPuff = gl.getUniformLocation(flow, 'u_puff')

    const createFlowTarget = () => {
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const framebuffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
      )
      return { texture, framebuffer }
    }
    // Each step reads the flow from one and writes the next into the other
    let current = createFlowTarget()
    let next = createFlowTarget()
    const flowSize = { width: 0, height: 0 }

    const resize = () => {
      const width = Math.round(canvas.clientWidth * RESOLUTION_SCALE)
      const height = Math.round(canvas.clientHeight * RESOLUTION_SCALE)
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      flowSize.width = Math.round(width * FLOW_SCALE)
      flowSize.height = Math.round(height * FLOW_SCALE)
      for (const { texture } of [current, next]) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          flowSize.width,
          flowSize.height,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          null,
        )
      }
    }

    const drawBackground = (now: number) => {
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram is not a React hook
      gl.useProgram(background)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.bindTexture(gl.TEXTURE_2D, current.texture)
      gl.uniform2f(backgroundResolution, canvas.width, canvas.height)
      gl.uniform1f(backgroundTime, now / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const drawStill = () => {
        resize()
        drawBackground(0)
      }
      drawStill()
      window.addEventListener('resize', drawStill)
      return () => window.removeEventListener('resize', drawStill)
    }

    const pointer = { x: 0, y: 0 }
    const previous = { x: 0, y: 0 }
    let isTracking = false
    let puff = 0
    let last = 0

    const follow = (event: PointerEvent) => {
      const shortSide = Math.min(canvas.clientWidth, canvas.clientHeight)
      pointer.x = (event.clientX - canvas.clientWidth / 2) / shortSide
      pointer.y = (canvas.clientHeight / 2 - event.clientY) / shortSide
      // A pointer arriving from elsewhere has not dragged through the smoke in between
      if (isTracking && event.type === 'pointermove') return
      previous.x = pointer.x
      previous.y = pointer.y
      isTracking = true
    }
    const press = (event: PointerEvent) => {
      follow(event)
      puff = 1
    }
    const leave = () => {
      isTracking = false
    }
    window.addEventListener('pointermove', follow)
    window.addEventListener('pointerdown', press)
    document.documentElement.addEventListener('pointerleave', leave)

    let frame = requestAnimationFrame(function loop(now) {
      resize()

      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram is not a React hook
      gl.useProgram(flow)
      gl.bindFramebuffer(gl.FRAMEBUFFER, next.framebuffer)
      gl.viewport(0, 0, flowSize.width, flowSize.height)
      gl.bindTexture(gl.TEXTURE_2D, current.texture)
      gl.uniform2f(flowResolution, flowSize.width, flowSize.height)
      // A frame after a long pause would otherwise fling the smoke across the screen
      gl.uniform1f(flowElapsed, Math.min((now - last) / 1000, 1 / 30))
      gl.uniform2f(flowPointer, pointer.x, pointer.y)
      gl.uniform2f(flowPrevious, previous.x, previous.y)
      gl.uniform1f(flowPuff, puff)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      ;[current, next] = [next, current]
      previous.x = pointer.x
      previous.y = pointer.y
      puff = 0
      last = now

      drawBackground(now)
      frame = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('pointerdown', press)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={isHome ? 'background' : 'background dimmed'}
    />
  )
}
