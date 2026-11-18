import { createFileRoute, Link } from '@tanstack/react-router'
import { getBlogPosts } from '@/lib/blog'

function BlogIndexPage() {
  const posts = getBlogPosts()

  return (
    <section className="page">
      <h1>Writing</h1>
      <p className="lede">
        Occasional writing about software, craft, and things I'm learning.
      </p>

      <ul className="rows">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link className="row" to="/blog/$slug" params={{ slug: post.slug }}>
              <span className="row-title">{post.title}</span>
              <time className="row-aside" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              {post.description ? (
                <span className="row-note">{post.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatDate(date: string): string {
  if (!date) return 'Undated'

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
})
