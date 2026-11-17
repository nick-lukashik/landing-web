import * as THREE from 'three'
import META from './meta.json'
import { CARD_FRAGMENT, CARD_VERTEX, DROP_FRAGMENT, DROP_VERTEX, RELIEF_FRAGMENT, RELIEF_VERTEX } from './shaders'

/** The textures, made from the approved render by a separate texture pipeline. */
const TEXTURES = {
    color: '/nl/color.webp',
    d1: '/nl/data1.png',
    d2: '/nl/data2.png',
    d3: '/nl/data3.png',
    glow: '/nl/glow.jpg',
}

export type SceneOptions = {
    /** Reduced motion: no intro, a still logo. */
    reduce: boolean
    /** Start already drawn (a later visit to the home page). */
    skipIntro: boolean
    /** The pen is done: time to show the name. */
    onNamed: () => void
    /** The intro is over (or skipped): show the page. */
    onFinish: () => void
}

export type Scene = {
    /** On the home page the logo shows; elsewhere it fades out and stops drawing. */
    setActive: (active: boolean) => void
    replay: () => void
    skip: () => void
    dispose: () => void
}

/**
 * The NL monogram on the first screen: it writes itself along the pen
 * strokes, throws mercury beads, settles on the right of the hero over a
 * water reflection, and then lives on: a key light drifts above it, it sways
 * and follows the cursor. Throws if WebGL is not available.
 */
export function createScene(host: HTMLElement, options: SceneOptions): Scene {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.classList.add('block', 'size-full')
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100)
    camera.position.set(0, 0, 10)

    let pending = 5
    let started = false
    const texture = (src: string, { nearest = false, premultiply = false } = {}) => {
        const result = new THREE.Texture()
        const image = new Image()
        image.onload = () => {
            result.image = image
            result.needsUpdate = true
            pending -= 1
            if (pending === 0) start()
        }
        image.onerror = () => {
            if (!started) options.onFinish()
        }
        image.src = src
        result.colorSpace = THREE.NoColorSpace
        result.flipY = false
        result.generateMipmaps = false
        result.premultiplyAlpha = premultiply
        result.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter
        result.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter
        result.wrapS = THREE.ClampToEdgeWrapping
        result.wrapT = THREE.ClampToEdgeWrapping
        return result
    }

    const IW = 4.4
    const IH = IW / (META.w / META.h)
    const SC = IW / META.w
    const X0 = -0.2
    const X1 = 1.2
    const Y0 = -0.18
    const Y1 = 1.62
    const U = {
        uColor: {
            value: texture(TEXTURES.color, {
                premultiply: true,
            }),
        },
        uD1: {
            value: texture(TEXTURES.d1),
        },
        uD2: {
            value: texture(TEXTURES.d2, {
                nearest: true,
            }),
        },
        uD3: {
            value: texture(TEXTURES.d3),
        },
        uGlow: {
            value: texture(TEXTURES.glow),
        },
        uP: {
            value: new THREE.Vector3(),
        },
        uDur: {
            value: new THREE.Vector3(1, 1, 1),
        },
        uSoft: {
            value: new THREE.Vector3(0.01, 0.01, 0.01),
        },
        uTime: {
            value: 0,
        },
        uBloom: {
            value: 0,
        },
        uHover: {
            value: 0,
        },
        uIdle: {
            value: 0,
        },
        uFloor: {
            value: META.floor,
        },
        uRefl: {
            value: 1,
        },
        uFade: {
            value: 1,
        },
        uTips: {
            value: [
                new THREE.Vector3(),
                new THREE.Vector3(),
                new THREE.Vector3(),
            ],
        },
        uSweep: {
            value: new THREE.Vector2(-1, 0),
        },
        uMouse: {
            value: new THREE.Vector2(0.5, 0.5),
        },
        uRange: {
            value: new THREE.Vector4(X0, X1, Y0, Y1),
        },
        uZr: {
            value: new THREE.Vector2(META.zr[0], META.zr[1]),
        },
        uProf: {
            value: 26 * SC,
        },
    }

    const relief = (side: number) =>
        new THREE.ShaderMaterial({
            uniforms: {
                ...U,
                uSide: {
                    value: side,
                },
                uNM: {
                    value: new THREE.Matrix3(),
                },
            },
            transparent: false,
            blending: THREE.NoBlending,
            alphaToCoverage: true,
            depthTest: true,
            depthWrite: true,
            side: THREE.DoubleSide,
            vertexShader: RELIEF_VERTEX,
            fragmentShader: RELIEF_FRAGMENT,
        })

    const cardMaterial = new THREE.ShaderMaterial({
        uniforms: U,
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
        vertexShader: CARD_VERTEX,
        fragmentShader: CARD_FRAGMENT,
    })

    const root = new THREE.Group()
    scene.add(root)
    const obj = new THREE.Group()
    root.add(obj)
    const card = new THREE.Mesh(new THREE.PlaneGeometry((X1 - X0) * IW, (Y1 - Y0) * IH), cardMaterial)
    card.position.set(((X0 + X1) / 2 - 0.5) * IW, -((Y0 + Y1) / 2 - 0.5) * IH, 0)
    card.renderOrder = -2
    obj.add(card)
    const grid = new THREE.PlaneGeometry(IW, IH, 480, 320)
    const frontMaterial = relief(1)
    const backMaterial = relief(-1)
    const front = new THREE.Mesh(grid, frontMaterial)
    const back = new THREE.Mesh(grid, backMaterial)
    front.frustumCulled = false
    back.frustumCulled = false
    back.renderOrder = -1
    obj.add(back, front)
    const toWorld = (u: number, v: number, out: THREE.Vector3) => out.set((u - 0.5) * IW, (0.5 - v) * IH, 0.06)

    // Beads of mercury thrown off the pen: they fall, bounce on the floor and are gone.
    const SP = 220
    const spPos = new Float32Array(SP * 3)
    const spVel = new Float32Array(SP * 3)
    const spSize = new Float32Array(SP)
    const spLife = new Float32Array(SP)
    const spMax = new Float32Array(SP)
    const spA = new Float32Array(SP)
    let spNext = 0
    const spGeo = new THREE.BufferGeometry()
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3))
    spGeo.setAttribute('aSize', new THREE.BufferAttribute(spA, 1))
    const ball = (() => {
        const S = 128
        const canvas = document.createElement('canvas')
        canvas.width = S
        canvas.height = S
        const g = canvas.getContext('2d')
        if (g) {
            let gr = g.createRadialGradient(S * 0.4, S * 0.34, 0, S * 0.5, S * 0.5, S * 0.5)
            gr.addColorStop(0, '#ffffff')
            gr.addColorStop(0.16, '#f2f5fa')
            gr.addColorStop(0.36, '#9aa1ad')
            gr.addColorStop(0.62, '#2b2e35')
            gr.addColorStop(0.86, '#08090b')
            gr.addColorStop(0.95, '#6f7682')
            gr.addColorStop(1, '#c9cfd9')
            g.fillStyle = gr
            g.beginPath()
            g.arc(S / 2, S / 2, S / 2 - 1.5, 0, 6.3)
            g.fill()
            gr = g.createRadialGradient(S * 0.66, S * 0.72, 0, S * 0.66, S * 0.72, S * 0.2)
            gr.addColorStop(0, 'rgba(235,240,250,.75)')
            gr.addColorStop(1, 'rgba(235,240,250,0)')
            g.fillStyle = gr
            g.beginPath()
            g.arc(S / 2, S / 2, S / 2 - 1.5, 0, 6.3)
            g.fill()
        }
        const result = new THREE.CanvasTexture(canvas)
        result.colorSpace = THREE.NoColorSpace
        return result
    })()
    const dropMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uMap: {
                value: ball,
            },
            uPx: {
                value: 1,
            },
            uFade: U.uFade,
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        vertexShader: DROP_VERTEX,
        fragmentShader: DROP_FRAGMENT,
    })
    const sparks = new THREE.Points(spGeo, dropMaterial)
    sparks.frustumCulled = false
    sparks.renderOrder = 5
    obj.add(sparks)
    const FLOOR_Y = (0.5 - META.floor) * IH
    const emit = (p: THREE.Vector3, dir: THREE.Vector3) => {
        if (Math.random() > 0.55) return
        const i = spNext
        spNext = (spNext + 1) % SP
        spPos.set(
            [
                p.x,
                p.y,
                p.z + 0.05,
            ],
            i * 3,
        )
        const a = Math.random() * Math.PI * 2
        const v = 0.3 + Math.random() * 1.1
        spVel.set(
            [
                Math.cos(a) * v * 0.7 - dir.x * 0.5,
                Math.abs(Math.sin(a)) * v * 0.9 + 0.2,
                (Math.random() - 0.3) * 0.9,
            ],
            i * 3,
        )
        spSize[i] = 0.018 + Math.random() ** 3 * 0.075
        const life = 1.1 + Math.random() * 1.3
        spMax[i] = life
        spLife[i] = life
    }

    // Layout: centred and large while it writes, then on the right of the hero (above it on narrow screens).
    const MW = 0.9 * IW
    const half = () => {
        const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10
        return [
            hh * camera.aspect,
            hh,
        ] as const
    }
    const introLayout = () => {
        const [hw, hh] = half()
        return {
            x: 0,
            y: hh * 0.17,
            s: Math.min((hw * 2 * 0.62) / MW, (hh * 2 * 0.56) / (IH * 0.82)),
        }
    }
    // The hero copy takes the left 560px of the 1240px page (src/app/page.tsx): the logo fills what is left on the right.
    const heroLayout = () => {
        const [hw, hh] = half()
        if (innerWidth < 980) {
            return {
                x: 0,
                y: hh * 0.45,
                s: (hw * 2 * 0.78) / MW,
            }
        }
        const side = Math.max(0, (innerWidth - 1240) / 2)
        const left = side + 32 + 560 + 24
        const right = innerWidth - Math.max(24, side)
        const perPx = (hw * 2) / innerWidth
        return {
            x: ((left + right) / 2 - innerWidth / 2) * perPx,
            y: hh * 0.08,
            s: Math.min(((right - left) * perPx) / MW, (hh * 2 * 0.62) / (IH * 0.82)),
        }
    }
    const layout = introLayout()
    let target = introLayout()

    // Timeline: three pen strokes, then a sweep of light, the name, and the page.
    const K = 0.5
    const DRAW0 = 0.3
    const ST = META.sched.map(([a = 0, d = 1], k) => ({
        t0: DRAW0 + a * K,
        dur: d * K,
        len: META.len[k] ?? 1,
        path: META.path[k] ?? [],
    }))
    const DRAW_END = Math.max(...ST.map(s => s.t0 + s.dur))
    const TL = {
        sweep: DRAW_END,
        name: DRAW_END + 0.1,
        out: DRAW_END + 1.15,
    }
    U.uDur.value.set(ST[0]?.dur ?? 1, ST[1]?.dur ?? 1, ST[2]?.dur ?? 1)
    U.uSoft.value.set(7 / (ST[0]?.len ?? 1), 7 / (ST[1]?.len ?? 1), 7 / (ST[2]?.len ?? 1))
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
    const smooth = (x: number) => {
        const c = clamp01(x)
        return c * c * (3 - 2 * c)
    }
    const easePen = (x: number) =>
        x < 0 ? 0 : x > 1 ? x : (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) * 0.55 + x * 0.45
    const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3
    const pathAt = (path: number[][], s: number) => {
        const f = clamp01(s) * (path.length - 1)
        const i = Math.floor(f)
        const j = Math.min(path.length - 1, i + 1)
        const u = f - i
        const p = path[i] ?? [
            0,
            0,
        ]
        const q = path[j] ?? p
        return [
            (p[0] ?? 0) + ((q[0] ?? 0) - (p[0] ?? 0)) * u,
            (p[1] ?? 0) + ((q[1] ?? 0) - (p[1] ?? 0)) * u,
        ] as const
    }

    let skipped = options.skipIntro || options.reduce
    let finished = false
    let named = false
    let active = true
    let T0 = 0
    let frameId = 0
    let last = 0
    let dirty = true
    let cleared = false

    const mouse = new THREE.Vector2()
    const tilt = new THREE.Vector2()
    const zero = new THREE.Vector2()
    const ndc = new THREE.Vector2(9, 9)
    const ray = new THREE.Raycaster()
    let hoverT = 0
    let scrollPos = scrollY

    const onPointer = (event: PointerEvent) => {
        if (options.reduce) return
        mouse.set((event.clientX / innerWidth) * 2 - 1, -((event.clientY / innerHeight) * 2 - 1))
        ndc.copy(mouse)
    }
    const onResize = () => {
        camera.aspect = innerWidth / innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(innerWidth, innerHeight)
        target = finished ? heroLayout() : introLayout()
        if (options.reduce) Object.assign(layout, target)
        dirty = true
    }
    const onScroll = () => {
        scrollPos = scrollY
        dirty = true
    }
    addEventListener('pointermove', onPointer)
    addEventListener('resize', onResize)
    addEventListener('scroll', onScroll, {
        passive: true,
    })

    const v3 = new THREE.Vector3()
    const v3b = new THREE.Vector3()
    const m4 = new THREE.Matrix4()

    function frame(time: number) {
        frameId = requestAnimationFrame(frame)
        // Reduced motion: one still moment, redrawn only when the page asks.
        const now = options.reduce ? 4000 : time
        const t = (now - T0) / 1000
        const dt = Math.min(0.25, Math.max(0, (time - last) / 1000))
        // The beads move in small steps, so a long frame does not throw them through the floor.
        const step = Math.min(0.05, dt)
        const it = skipped ? 1e3 : t
        last = time
        U.uTime.value = now / 1000

        // The pen.
        ST.forEach((s, k) => {
            const x = (it - s.t0) / s.dur
            const P = skipped ? 60 : easePen(x)
            U.uP.value.setComponent(k, P)
            const tip = U.uTips.value[k]
            if (!tip) return
            if (x > 0 && x < 1.04 && !skipped) {
                const [px, py] = pathAt(s.path, P)
                const [qx, qy] = pathAt(s.path, P - 0.012)
                tip.set(px, py, Math.sin(Math.PI * clamp01(x / 1.04)) ** 0.35)
                toWorld(px, py, v3)
                v3b.set(px - qx, qy - py, 0).normalize()
                emit(v3, v3b)
            } else tip.z = 0
        })
        for (let i = 0; i < SP; i++) {
            const i3 = i * 3
            const life = spLife[i] ?? 0
            if (life > 0) {
                const size = spSize[i] ?? 0
                spLife[i] = life - step
                spVel[i3 + 1] = (spVel[i3 + 1] ?? 0) - 4.2 * step
                for (let c = 0; c < 3; c++) spPos[i3 + c] = (spPos[i3 + c] ?? 0) + (spVel[i3 + c] ?? 0) * step
                if ((spPos[i3 + 1] ?? 0) < FLOOR_Y + size * 0.5) {
                    spPos[i3 + 1] = FLOOR_Y + size * 0.5
                    spVel[i3 + 1] = Math.abs(spVel[i3 + 1] ?? 0) * 0.32
                    spVel[i3] = (spVel[i3] ?? 0) * 0.72
                    spVel[i3 + 2] = (spVel[i3 + 2] ?? 0) * 0.72
                }
                spA[i] = size * smooth((spLife[i] ?? 0) / 0.45) * smooth(((spMax[i] ?? 0) - (spLife[i] ?? 0)) / 0.08)
            } else spA[i] = 0
        }
        for (const attribute of Object.values(spGeo.attributes)) attribute.needsUpdate = true
        if (dropMaterial.uniforms.uPx) {
            dropMaterial.uniforms.uPx.value =
                ((renderer.domElement.height * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * layout.s
        }

        const idle = skipped ? 1 : smooth((it - DRAW_END) / 0.8)
        U.uIdle.value = idle
        const f = it - TL.sweep
        if (!skipped && f > 0 && f < 0.85)
            U.uSweep.value.set(-0.25 + (f / 0.85) * 1.6, Math.sin((Math.PI * f) / 0.85) * 0.9)
        else {
            const g = ((now / 1000) % 4.0) / 1.1
            U.uSweep.value.set(
                -0.25 + g * 1.6,
                g < 1 && idle > 0.99 && !options.reduce ? Math.sin(Math.PI * g) * 0.5 : 0,
            )
        }
        const drawn = skipped ? 1 : smooth((it - DRAW0) / (DRAW_END - DRAW0))
        U.uBloom.value = 0.05 + drawn * 0.07 + (f > 0 && f < 0.9 && !skipped ? Math.sin((Math.PI * f) / 0.9) * 0.2 : 0)

        if (!skipped) {
            if (!named && it > TL.name) {
                named = true
                options.onNamed()
            }
            if (!finished && it > TL.out) {
                finished = true
                target = heroLayout()
                options.onFinish()
            }
            if (!finished) target = introLayout()
        } else if (!finished) {
            finished = true
            target = heroLayout()
            Object.assign(layout, target)
            options.onFinish()
        }
        // Smoothing by time, not by frame, so a slow device settles as fast as a quick one.
        const follow = (rate: number) => 1 - Math.exp(-rate * dt)
        const kk = follow(finished ? 4.7 : 9)
        layout.x += (target.x - layout.x) * kk
        layout.y += (target.y - layout.y) * kk
        layout.s += (target.s - layout.s) * kk

        const sc = clamp01(scrollPos / innerHeight)
        const fadeTo = active ? 1 - sc * 0.92 : 0
        U.uFade.value += (fadeTo - U.uFade.value) * (options.reduce ? 1 : follow(7.7))
        U.uRefl.value = innerWidth < 980 ? 0.35 : 1
        root.position.set(layout.x, layout.y + sc * 1.3 + Math.sin((now / 1000) * 0.6) * 0.03 * idle, 0)
        root.scale.setScalar(layout.s)

        // It starts turned away in the dark and swings round as it is written; afterwards it sways and follows the cursor.
        const d = skipped ? 1 : easeOut((it - 0.1) / (DRAW_END + 0.35))
        tilt.lerp(finished ? mouse : zero, follow(3.1))
        const yaw = (1 - d) * -0.62 + tilt.x * 0.4 + Math.sin((now / 1000) * 0.62) * 0.15 * idle
        const pitch = (1 - d) * 0.2 - tilt.y * 0.2 + Math.sin((now / 1000) * 0.47) * 0.045 * idle
        obj.rotation.set(pitch, yaw, 0)
        camera.position.z = 10 - (1 - d) * 2.2

        let hover = 0
        root.updateMatrixWorld()
        camera.updateMatrixWorld()
        if (finished && active && !options.reduce) {
            ray.setFromCamera(ndc, camera)
            const hit = ray.intersectObject(card)[0]
            if (hit?.uv) {
                const px = X0 + (X1 - X0) * hit.uv.x
                const py = Y1 + (Y0 - Y1) * hit.uv.y
                if (px > 0 && px < 1 && py > 0.03 && py < META.floor) {
                    hover = 1
                    U.uMouse.value.lerp(new THREE.Vector2(px, py), follow(13))
                }
            }
        }
        hoverT += (hover - hoverT) * follow(3.7)
        U.uHover.value = hoverT
        m4.multiplyMatrices(camera.matrixWorldInverse, front.matrixWorld)
        const nm = frontMaterial.uniforms.uNM?.value as THREE.Matrix3 | undefined
        nm?.getNormalMatrix(m4)
        if (nm) (backMaterial.uniforms.uNM?.value as THREE.Matrix3 | undefined)?.copy(nm)

        if (options.reduce && !dirty) return
        dirty = false
        // Nothing to draw once the logo has faded out (another page) or the sections cover it
        // (scrolled past the hero): clear once and let the GPU rest.
        const covered = scrollPos > innerHeight * 1.05
        if (U.uFade.value > 0.004 && !covered) {
            renderer.render(scene, camera)
            cleared = false
        } else if (!cleared) {
            renderer.clear()
            cleared = true
        }
    }

    function start() {
        started = true
        T0 = performance.now()
        Object.assign(layout, skipped ? heroLayout() : introLayout())
        frameId = requestAnimationFrame(frame)
    }

    return {
        setActive(next) {
            active = next
            dirty = true
        },
        replay() {
            if (options.reduce) return
            T0 = performance.now()
            skipped = false
            finished = false
            named = false
            U.uP.value.set(0, 0, 0)
            scrollTo(0, 0)
            Object.assign(layout, introLayout())
            target = introLayout()
        },
        skip() {
            skipped = true
        },
        dispose() {
            cancelAnimationFrame(frameId)
            removeEventListener('pointermove', onPointer)
            removeEventListener('resize', onResize)
            removeEventListener('scroll', onScroll)
            for (const material of [
                frontMaterial,
                backMaterial,
                cardMaterial,
                dropMaterial,
            ])
                material.dispose()
            for (const value of [
                U.uColor.value,
                U.uD1.value,
                U.uD2.value,
                U.uD3.value,
                U.uGlow.value,
                ball,
            ])
                value.dispose()
            grid.dispose()
            card.geometry.dispose()
            spGeo.dispose()
            renderer.dispose()
            renderer.domElement.remove()
        },
    }
}
