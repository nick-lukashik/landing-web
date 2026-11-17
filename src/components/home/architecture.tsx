/** Grid of the platform diagram: columns 220 apart, boxes 175 wide (stores 190), 56 high. */
const COL = 220
const BOX = 175
const STORE = 190
const H = 56
const x = (column: number) => 20 + column * COL

/** Boxes: column, top, name and a short mono caption, both tech names. */
const NODES = [
    [
        0,
        122,
        'Cloudflare',
        'DNS · TLS · R2',
    ],
    [
        1,
        122,
        'Traefik',
        'ORIGIN PULLS',
    ],
    [
        2,
        122,
        'K3s',
        'ARGO CD',
    ],
    [
        3,
        32,
        'landing-web',
        'NEXT.JS',
    ],
    [
        3,
        122,
        'id-web',
        'PASSKEYS',
    ],
    [
        3,
        212,
        'digests',
        'CRONJOB · GA → TG',
    ],
    [
        4,
        32,
        'id-api',
        'NESTJS · ES256',
    ],
    [
        4,
        122,
        'wallet · notify',
        'NESTJS',
    ],
    [
        4,
        212,
        'llm-gateway',
        'CODEX · CLAUDE',
    ],
] as const

const STORES = [
    [
        5,
        82,
        'Postgres · CNPG',
        'PITR 14 DAYS',
    ],
    [
        5,
        172,
        'RabbitMQ · Redis',
        'OUTBOX · INBOX',
    ],
] as const

/** From the right edge of one box to the left edge of another, curving when the rows differ. */
const link = (from: number, fromTop: number, to: number, toTop: number) => {
    const x0 = x(from) + BOX
    const x1 = x(to)
    const y0 = fromTop + H / 2
    const y1 = toTop + H / 2
    const mid = (x0 + x1) / 2
    return y0 === y1 ? `M${x0} ${y0}H${x1}` : `M${x0} ${y0}C${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`
}

const LINES = [
    link(0, 122, 1, 122),
    link(1, 122, 2, 122),
    link(2, 122, 3, 32),
    link(2, 122, 3, 122),
    link(2, 122, 3, 212),
    link(3, 32, 4, 32),
    link(3, 122, 4, 122),
    link(3, 212, 4, 212),
    link(4, 32, 5, 82),
    link(4, 122, 5, 82),
    link(4, 122, 5, 172),
    link(4, 212, 5, 172),
]

const WIDTH = x(5) + STORE + 20

/** The platform at a glance: edge, cluster, apps, APIs and stores, with traffic running along the lines. */
export function Architecture({ label }: { label: string }) {
    return (
        <figure className="reveal mb-7 overflow-x-auto border border-foreground p-7">
            <svg
                viewBox={`0 0 ${WIDTH} 300`}
                fill="none"
                role="img"
                aria-label={label}
                className="h-auto w-full min-w-[980px]"
            >
                <g
                    stroke="#ffffff"
                    strokeOpacity={0.7}
                    strokeWidth={1.2}
                    className="flow"
                >
                    {LINES.map(d => (
                        <path
                            key={d}
                            d={d}
                        />
                    ))}
                </g>
                {[
                    ...NODES.map(([column, top, name, note]) => ({
                        left: x(column),
                        top,
                        width: BOX,
                        name,
                        note,
                    })),
                    ...STORES.map(([column, top, name, note]) => ({
                        left: x(column),
                        top,
                        width: STORE,
                        name,
                        note,
                    })),
                ].map(({ left, top, width, name, note }) => (
                    <g key={name}>
                        <rect
                            x={left}
                            y={top}
                            width={width}
                            height={H}
                            fill="#000000"
                            stroke="#ffffff"
                        />
                        <circle
                            cx={left + width - 14}
                            cy={top + 14}
                            r={3.5}
                            fill="#b9ff3d"
                        />
                        <text
                            x={left + 16}
                            y={top + 26}
                            fill="#ffffff"
                            className="font-mono text-[12px]"
                        >
                            {name}
                        </text>
                        <text
                            x={left + 16}
                            y={top + 44}
                            fill="#a3a3a3"
                            className="font-mono text-[10px] font-medium tracking-[0.08em]"
                        >
                            {note}
                        </text>
                    </g>
                ))}
            </svg>
        </figure>
    )
}
