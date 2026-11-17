/**
 * What the pages are made of, apart from the words: ids, order, tech names,
 * links and dates. The words live in `src/i18n/messages/{en,ru}.json` under
 * the same ids (`platform.parts.<id>`, `blog.posts.<id>`, `tools.items.<id>`).
 */

/** The 30-minute intro call. */
export const CALL_URL = 'https://calendly.com/nick-lukashik/30min'

export type IconName = 'server' | 'git' | 'code' | 'shield' | 'bolt' | 'card' | 'brain' | 'chart'

type Repo = {
    name: string
    href: string
    /** Not public: the link goes to the organisation. */
    private?: boolean
}

type Part = {
    id: string
    icon: IconName
    /** Tech names, the same in every language. */
    stack: string[]
    repos: Repo[]
}

const org = 'https://github.com/nick-lukashik'

/** The parts of the platform, in the order of the home page grid. */
export const PARTS = [
    {
        id: 'infrastructure',
        icon: 'server',
        stack: [
            'K3s',
            'Cloudflare',
            'Terraform',
            'Tailscale',
        ],
        repos: [
            {
                name: 'infra',
                href: org,
                private: true,
            },
        ],
    },
    {
        id: 'gitops',
        icon: 'git',
        stack: [
            'Argo CD',
            'GitHub Actions',
            'GHCR',
        ],
        repos: [
            {
                name: 'gitops',
                href: `${org}/gitops`,
            },
            {
                name: '.github',
                href: `${org}/.github`,
            },
        ],
    },
    {
        id: 'starters',
        icon: 'code',
        stack: [
            'Next.js 16',
            'NestJS',
            'Drizzle',
            'Zod',
        ],
        repos: [
            {
                name: 'next-starter',
                href: `${org}/next-starter`,
            },
            {
                name: 'nest-starter',
                href: `${org}/nest-starter`,
            },
            {
                name: 'nest-example',
                href: `${org}/nest-example`,
            },
        ],
    },
    {
        id: 'identity',
        icon: 'shield',
        stack: [
            'Passkeys',
            'Email code',
            'Google',
            'ES256',
        ],
        repos: [
            {
                name: 'id-api',
                href: `${org}/id-api`,
            },
            {
                name: 'id-web',
                href: `${org}/id-web`,
            },
        ],
    },
    {
        id: 'events',
        icon: 'bolt',
        stack: [
            'RabbitMQ',
            'Outbox',
            'Inbox',
            'DLQ',
        ],
        repos: [
            {
                name: 'nest-example',
                href: `${org}/nest-example`,
            },
        ],
    },
    {
        id: 'payments',
        icon: 'card',
        stack: [
            'Ledger',
            'Idempotency',
            'Webhooks',
        ],
        repos: [
            {
                name: 'wallet-api',
                href: `${org}/wallet-api`,
            },
            {
                name: 'pay-api',
                href: `${org}/pay-api`,
            },
        ],
    },
    {
        id: 'llm-gateway',
        icon: 'brain',
        stack: [
            'OpenAI-compatible',
            'Codex',
            'Claude',
        ],
        repos: [
            {
                name: 'llm-gateway',
                href: `${org}/llm-gateway`,
            },
        ],
    },
    {
        id: 'observability',
        icon: 'chart',
        stack: [
            'Prometheus',
            'Loki',
            'Grafana',
        ],
        repos: [
            {
                name: 'gitops / monitoring',
                href: `${org}/gitops`,
            },
        ],
    },
] as const satisfies Part[]

export type PartId = (typeof PARTS)[number]['id']

export function findPart(id: string) {
    return PARTS.find(part => part.id === id)
}

export type TagId = 'observability' | 'k3s' | 'webgl' | 'three' | 'ai' | 'testing' | 'reliability'

type Post = {
    id: string
    /** Publication day, ISO. */
    date: string
    minutes: number
    tags: TagId[]
}

/** Blog notes, newest first. */
export const POSTS = [
    {
        id: 'alerts-noise',
        date: '2026-11-16',
        minutes: 5,
        tags: [
            'observability',
            'k3s',
        ],
    },
    {
        id: 'liquid-logo',
        date: '2026-11-16',
        minutes: 6,
        tags: [
            'webgl',
            'three',
            'ai',
        ],
    },
    {
        id: 'failure-tests',
        date: '2026-11-15',
        minutes: 4,
        tags: [
            'testing',
            'reliability',
        ],
    },
] as const satisfies Post[]

export type PostId = (typeof POSTS)[number]['id']

export function findPost(id: string) {
    return POSTS.find(post => post.id === id)
}

export type ToolCategory = 'ai' | 'delivery' | 'infra' | 'observability'

/** The tools page: product names stay as they are in every language. */
export const TOOLS = [
    {
        id: 'claude-code',
        name: 'Claude Code',
        category: 'ai',
    },
    {
        id: 'codex',
        name: 'Codex',
        category: 'ai',
    },
    {
        id: 'mcp',
        name: 'MCP',
        category: 'ai',
    },
    {
        id: 'github-actions',
        name: 'GitHub Actions',
        category: 'delivery',
    },
    {
        id: 'argo-cd',
        name: 'Argo CD',
        category: 'delivery',
    },
    {
        id: 'playwright',
        name: 'Playwright',
        category: 'delivery',
    },
    {
        id: 'terraform',
        name: 'Terraform',
        category: 'infra',
    },
    {
        id: 'k3s',
        name: 'K3s',
        category: 'infra',
    },
    {
        id: 'cloudflare',
        name: 'Cloudflare',
        category: 'infra',
    },
    {
        id: 'bitwarden',
        name: 'Bitwarden',
        category: 'infra',
    },
    {
        id: 'grafana',
        name: 'Grafana',
        category: 'observability',
    },
    {
        id: 'prometheus',
        name: 'Prometheus',
        category: 'observability',
    },
] as const satisfies {
    id: string
    name: string
    category: ToolCategory
}[]

export const TOOL_CATEGORIES: ToolCategory[] = [
    'ai',
    'delivery',
    'infra',
    'observability',
]
