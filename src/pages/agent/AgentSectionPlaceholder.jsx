import { Link } from 'react-router-dom'

export default function AgentSectionPlaceholder({ title, subtitle }) {
  return (
    <div className="px-6 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      <p className="mt-6 text-sm text-slate-600">
        This section uses the same agent layout. Return to{' '}
        <Link to="/agent" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Overview
        </Link>
        .
      </p>
    </div>
  )
}
