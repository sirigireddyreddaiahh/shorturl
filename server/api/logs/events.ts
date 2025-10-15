import type { H3Event } from 'h3'
import { QuerySchema } from '@@/schemas/query'
import { date2unix } from '~/utils/time'

const { select } = SqlBricks

function query2sql(query: Query, event: H3Event): string {
  const filter = query2filter(query)
  const { dataset } = useRuntimeConfig(event)
  const sql = select(`*`).from(dataset).where(filter).orderBy('timestamp DESC')
  appendTimeFilter(sql, query)
  return sql.toString()
}

interface WAEEvents {
  [key: string]: string
}

function events2logs(events: WAEEvents[]) {
  return events.map((event) => {
    const blobs = Array.from({ length: Object.keys(blobsMap).length }).fill(0).reduce<string[]>((acc, _c, i) => {
      const val = event[`blob${i + 1}`]
      acc.push(typeof val === 'string' ? val : (val ?? ''))
      return acc
    }, [])
    const doubles = Array.from({ length: Object.keys(doublesMap).length }).fill(0).reduce<number[]>((acc, _c, i) => {
      const val = event[`double${i + 1}`]
      acc.push(Number(val ?? 0))
      return acc
    }, [])
    return {
      ...blobs2logs(blobs),
      ...doubles2logs(doubles),
      ip: undefined,
      id: crypto.randomUUID(),
      timestamp: date2unix(new Date(`${event.timestamp}Z`)),
    }
  })
}

export default eventHandler(async (event) => {
  const query = await getValidatedQuery(event, QuerySchema.parse)
  const sql = query2sql(query, event)

  const logs = await useWAE(event, sql) as { data: WAEEvents[] }
  return events2logs(logs?.data || [])
})
