/** Boxes of the platform diagram: name and a short mono caption, both tech names. */
const NODES = [
    [
        20,
        122,
        'Cloudflare',
        'DNS · TLS · R2',
    ],
    [
        210,
        122,
        'Traefik',
        'ORIGIN PULLS',
    ],
    [
        400,
        122,
        'K3s',
        'ARGO CD',
    ],
    [
        590,
        32,
        'landing-web',
        'NEXT.JS',
    ],
    [
        590,
        122,
        'id-web',
        'PASSKEYS',
    ],
    [
        590,
        212,
        'digests',
        'CRONJOB · GA → TG',
    ],
    [
        780,
        32,
        'id-api',
        'NESTJS · ES256',
    ],
    [
        780,
        122,
        'wallet · notify',
        'NESTJS',
    ],
    [
        780,
        212,
        'llm-gateway',
        'CODEX · CLAUDE',
    ],
] as const

const STORES = [
    [
        970,
        82,
        'Postgres · CNPG',
        'PITR 14 DAYS',
    ],
    [
        970,
        172,
        'RabbitMQ · Redis',
        'OUTBOX · INBOX',
    ],
] as const

const LINES = [
    'M150 150H210',
    'M340 150H400',
    'M530 150C560 150 560 60 590 60',
    'M530 150H590',
    'M530 150C560 150 560 240 590 240',
    'M720 60H780',
    'M720 150H780',
    'M720 240H780',
    'M910 60C940 60 940 110 970 110',
    'M910 150C940 150 940 110 970 110',
    'M910 150C940 150 940 200 970 200',
    'M910 240C940 240 940 200 970 200',
]

/** The platform at a glance: edge, cluster, apps, APIs and stores, with traffic running along the lines. */
export function Architecture({ label }: { label: string }) {
    return (
        <figure className="reveal mb-7 overflow-x-auto border border-foreground p-7">
            <svg
                viewBox="0 0 1160 300"
                fill="none"
                role="img"
                aria-label={label}
                className="h-auto w-full min-w-[900px]"
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
                    ...NODES.map(
                        ([x, y, name, note]) =>
                            [
                                x,
                                y,
                                130,
                                name,
                                note,
                            ] as const,
                    ),
                    ...STORES.map(
                        ([x, y, name, note]) =>
                            [
                                x,
                                y,
                                170,
                                name,
                                note,
                            ] as const,
                    ),
                ].map(([x, y, width, name, note]) => (
                    <g key={name}>
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={56}
                            fill="#000000"
                            stroke="#ffffff"
                        />
                        <circle
                            cx={x + width - 14}
                            cy={y + 14}
                            r={3.5}
                            fill="#b9ff3d"
                        />
                        <text
                            x={x + 16}
                            y={y + 26}
                            fill="#ffffff"
                            className="font-mono text-[12px]"
                        >
                            {name}
                        </text>
                        <text
                            x={x + 16}
                            y={y + 44}
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
