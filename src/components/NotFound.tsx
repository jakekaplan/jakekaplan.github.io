import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p className="lede">
        This page doesn't exist. <Link to="/">Go back home</Link>.
      </p>
    </section>
  )
}
