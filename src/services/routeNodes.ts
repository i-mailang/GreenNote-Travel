import type { Trip } from '../types/trip'
import { getVisibleStops } from '../utils/visibility'

export function routeNodesForTrip(trip: Trip) {
  const nodes = trip.days.flatMap((day) => getVisibleStops(day.stops, 'route').map((stop) => ({ ...stop, day: day.order })))
  return nodes.filter((node, index) => index === 0 || node.name !== nodes[index - 1].name)
}
