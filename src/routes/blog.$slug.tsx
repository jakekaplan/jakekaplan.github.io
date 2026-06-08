import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { getBlogPost } from '@/lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getBlogPost(params.slug)

    if (!post) {
      throw notFound()
    }

    return post
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const post = Route.useLoaderData()

  return (
    <article className="blog-shell blog-post">
      <Link className="blog-back-link" to="/blog">
        ← all posts
      </Link>

      <header className="blog-post-header">
        <div className="blog-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>{post.readingTime}</span>
        </div>
        <h1>{post.title}</h1>
        {post.description ? <p>{post.description}</p> : null}
      </header>

      <div className="markdown-body">
        <ReactMarkdown
          rehypePlugins={[rehypeHighlight]}
          remarkPlugins={[remarkGfm]}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
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
