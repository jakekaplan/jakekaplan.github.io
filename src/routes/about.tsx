import { createFileRoute } from '@tanstack/react-router'

function AboutPage() {
  return (
    <section className="page">
      <h1>About me</h1>
      <p className="lede">
        Hi, I'm Jake. I'm currently a staff engineer at{' '}
        <a
          href="https://www.prefect.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Prefect
        </a>
        , building infrastructure and tools for agents.
      </p>

      <h2>Things I've worked on recently</h2>
      <ul className="work">
        <li>
          <h3>
            <a
              href="https://horizon.prefect.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              FastMCP Gateway
            </a>
          </h3>
          <p>
            An enterprise hosting and governance platform for{' '}
            <a
              href="https://github.com/PrefectHQ/fastmcp"
              target="_blank"
              rel="noopener noreferrer"
            >
              FastMCP
            </a>{' '}
            and MCP servers.
          </p>
        </li>
        <li>
          <h3>
            <a
              href="https://app.prefect.cloud/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefect Cloud
            </a>
          </h3>
          <p>
            Scaling the hosted workflow orchestration platform for{' '}
            <a
              href="https://github.com/PrefectHQ/prefect"
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefect
            </a>
            .
          </p>
        </li>
      </ul>

      <h2>Other places I've worked</h2>
      <ul className="work">
        <li>
          <h3>Humanyze</h3>
          <p>Building people analytics from workplace communication data.</p>
        </li>
        <li>
          <h3>Stratagem Technologies</h3>
          <p>
            Building basketball models and a trading platform for a sports
            betting hedge fund.
          </p>
        </li>
        <li>
          <h3>
            <a
              href="https://www.comedycellar.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Comedy Cellar
            </a>
          </h3>
        </li>
      </ul>
    </section>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
})
