import { getBlogPost, getBlogPosts } from './blog'

describe('blog posts', () => {
  const posts = getBlogPosts()

  it('every post has a title and an ISO date', () => {
    for (const post of posts) {
      expect(post.title).not.toBe('')
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('slugs are unique', () => {
    const slugs = posts.map((post) => post.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('lists newest first', () => {
    const dates = posts.map((post) => post.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('finds a post by slug', () => {
    expect(getBlogPost('hello-world')?.title).toBe('Hello, blog')
    expect(getBlogPost('no-such-post')).toBeUndefined()
  })
})
