import type { Trip } from '../types/trip'
import { routeNodesForTrip } from '../services/routeNodes'

export function RouteOverview({ trip, currentDay }: { trip: Trip; currentDay: number }) {
  const unique = routeNodesForTrip(trip)
  return <ol className="route-line" aria-label="总路线">
    {unique.map((node) => <li key={`${node.id}-${node.day}`} className={node.day < currentDay ? 'past' : node.day === currentDay ? 'current' : 'future'}>
      <span className="route-dot" aria-hidden="true" /><span className="route-name">{node.name}</span><small>Day {node.day}</small>
    </li>)}
  </ol>
}
