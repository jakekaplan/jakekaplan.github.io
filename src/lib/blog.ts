export type BlogPost = {
  slug: string
  title: string
  date: string
  description?: string
  content: string
  readingTime: string
}

type Frontmatter = {
  title?: string
  date?: string
  description?: string
  slug?: string
}

const blogPostFiles = import.meta.glob<string>('../content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export function getBlogPosts(): BlogPost[] {
  return Object.entries(blogPostFiles)
    .map(([path, rawContent]) => parseBlogPost(path, rawContent))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.slug === slug)
}

function parseBlogPost(path: string, rawContent: string): BlogPost {
  const { frontmatter, content } = parseFrontmatter(rawContent)
  const fileSlug = path.split('/').pop()?.replace(/\.md$/, '')
  const slug = frontmatter.slug ?? fileSlug

  if (!slug) {
    throw new Error(`Could not determine slug for blog post: ${path}`)
  }

  return {
    slug,
    title: frontmatter.title ?? titleFromSlug(slug),
    date: frontmatter.date ?? '',
    description: frontmatter.description,
    content: content.trim(),
    readingTime: estimateReadingTime(content),
  }
}

function parseFrontmatter(rawContent: string): {
  frontmatter: Frontmatter
  content: string
} {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)

  if (!match) {
    return { frontmatter: {}, content: rawContent }
  }

  const frontmatterBlock = match[1]
  const content = match[2]

  if (frontmatterBlock === undefined || content === undefined) {
    return { frontmatter: {}, content: rawContent }
  }

  const frontmatter = frontmatterBlock
    .split(/\r?\n/)
    .reduce<Frontmatter>((metadata, line) => {
      const [rawKey, ...valueParts] = line.split(':')
      const key = rawKey?.trim()
      const value = valueParts
        .join(':')
        .trim()
        .replace(/^['"]|['"]$/g, '')

      if (!key || !value) return metadata

      if (
        key === 'title' ||
        key === 'date' ||
        key === 'description' ||
        key === 'slug'
      ) {
        metadata[key] = value
      }

      return metadata
    }, {})

  return { frontmatter, content }
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function estimateReadingTime(content: string): string {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 200))
  return `${minutes} min read`
}
