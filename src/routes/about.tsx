import { createFileRoute } from '@tanstack/react-router'

function AboutPage() {
  return (
    <div className="about-box">
      <h1>About Me</h1>
      <p>
        Hi, I'm Jake 👋. I'm a staff software engineer at{' '}
        <a
          href="https://www.prefect.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Prefect
        </a>
        , building infrastructure for workflows and agents.
      </p>
    </div>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
})
