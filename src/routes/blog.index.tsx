import { createFileRoute, Link } from '@tanstack/react-router'
import { getBlogPosts } from '@/lib/blog'

function BlogIndexPage() {
  const posts = getBlogPosts()

  return (
    <section className="blog-shell blog-index" aria-labelledby="blog-title">
      <div className="blog-header">
        <h1 id="blog-title">Blog</h1>
        <p>
          Occasional writing about software, craft, and things I'm learning.
        </p>
      </div>

      <div className="blog-list">
        {posts.map((post) => (
          <article className="blog-card" key={post.slug}>
            <Link to="/blog/$slug" params={{ slug: post.slug }}>
              <div className="blog-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>{post.readingTime}</span>
              </div>
              <h2>{post.title}</h2>
              {post.description ? <p>{post.description}</p> : null}
            </Link>
          </article>
        ))}
      </div>
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
