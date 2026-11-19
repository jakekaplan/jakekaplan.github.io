import { createFileRoute } from '@tanstack/react-router'

function HomePage() {
  return (
    <section className="home">
      <h1>Jake Kaplan</h1>
      <p>
        Staff engineer at{' '}
        <a
          href="https://www.prefect.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Prefect
        </a>
        , building infrastructure and tools for agents
      </p>
    </section>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
