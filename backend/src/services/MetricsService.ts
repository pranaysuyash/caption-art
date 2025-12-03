/**
 * Metrics Service
 * Implements application metrics collection for observability
 */

// Define metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

export interface MetricOptions {
  name: string
  help?: string
  labels?: string[]
}

export interface CounterMetric {
  inc(labels?: Record<string, string>, value?: number): void
  add(value: number, labels?: Record<string, string>): void
}

export interface GaugeMetric {
  inc(labels?: Record<string, string>, value?: number): void
  dec(labels?: Record<string, string>, value?: number): void
  set(value: number, labels?: Record<string, string>): void
  add(value: number, labels?: Record<string, string>): void
}

export interface HistogramMetric {
  observe(value: number, labels?: Record<string, string>): void
  startTimer(labels?: Record<string, string>): () => number
}

// In-memory metrics store for now (would use Prometheus client in production)
interface MetricValue {
  value: number
  labels?: Record<string, string>
  timestamp: number
}

class InMemoryMetricsRegistry {
  private counters: Map<string, Map<string, number>> = new Map() // name -> labelKey -> value
  private gauges: Map<string, Map<string, number>> = new Map()
  private histograms: Map<string, Map<string, number[]>> = new Map() // Store all observed values

  incrementCounter(
    name: string,
    labels: Record<string, string> = {},
    value: number = 1
  ) {
    const labelKey = this.getLabelKey(labels)
    let map = this.counters.get(name)
    if (!map) {
      map = new Map<string, number>()
      this.counters.set(name, map)
    }
    const currentValue = map.get(labelKey) || 0
    map.set(labelKey, currentValue + value)
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const labelKey = this.getLabelKey(labels)
    let map = this.gauges.get(name)
    if (!map) {
      map = new Map<string, number>()
      this.gauges.set(name, map)
    }
    map.set(labelKey, value)
  }

  observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ) {
    const labelKey = this.getLabelKey(labels)
    let map = this.histograms.get(name)
    if (!map) {
      map = new Map<string, number[]>()
      this.histograms.set(name, map)
    }
    const currentValues = map.get(labelKey) || []
    currentValues.push(value)
    map.set(labelKey, currentValues)
  }

  getMetrics() {
    const metrics: string[] = []

    // Format counters
    for (const [name, counterMap] of this.counters.entries()) {
      metrics.push(`# TYPE ${name} counter`)
      for (const [labelKey, value] of counterMap.entries()) {
        const labels = this.parseLabelKey(labelKey)
        const labelsStr = labels
          ? `{${Object.entries(labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')}}`
          : ''
        metrics.push(`${name}${labelsStr} ${value}`)
      }
    }

    // Format gauges
    for (const [name, gaugeMap] of this.gauges.entries()) {
      metrics.push(`# TYPE ${name} gauge`)
      for (const [labelKey, value] of gaugeMap.entries()) {
        const labels = this.parseLabelKey(labelKey)
        const labelsStr = labels
          ? `{${Object.entries(labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')}}`
          : ''
        metrics.push(`${name}${labelsStr} ${value}`)
      }
    }

    // Format histograms (simplified - just count, sum, and basic quantiles)
    for (const [name, histogramMap] of this.histograms.entries()) {
      metrics.push(`# TYPE ${name}_count counter`)
      metrics.push(`# TYPE ${name}_sum counter`)
      metrics.push(`# TYPE ${name}_avg gauge`)

      for (const [labelKey, values] of histogramMap.entries()) {
        const labels = this.parseLabelKey(labelKey)
        const labelsStr = labels
          ? `{${Object.entries(labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')}}`
          : ''

        const count = values.length
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = count > 0 ? sum / count : 0

        metrics.push(`${name}_count${labelsStr} ${count}`)
        metrics.push(`${name}_sum${labelsStr} ${sum}`)
        metrics.push(`${name}_avg${labelsStr} ${avg.toFixed(2)}`)
      }
    }

    return metrics.join('\n') + '\n'
  }

  private getLabelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('|')
  }

  private parseLabelKey(labelKey: string): Record<string, string> | null {
    if (!labelKey) return null

    const labels: Record<string, string> = {}
    labelKey.split('|').forEach((pair) => {
      const [k, v] = pair.split('=')
      if (k && v) {
        labels[k] = v
      }
    })

    return labels
  }
}

const registry = new InMemoryMetricsRegistry()

export class MetricsService {
  /**
   * Track API request with duration
   */
  static trackApiRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSec: number
  ) {
    registry.incrementCounter(
      'api_requests_total',
      { method, route, status_code: statusCode.toString() },
      1
    )
    registry.observeHistogram('api_request_duration_seconds', durationSec, {
      method,
      route,
      status_code: statusCode.toString(),
    })
  }

  /**
   * Track caption generation
   */
  static trackCaptionGeneration(
    workspaceId: string,
    campaignId: string | undefined,
    durationSec: number
  ) {
    const status = durationSec < 10 ? 'success' : 'slow'
    registry.incrementCounter(
      'caption_generations_total',
      {
        workspace_id: workspaceId,
        campaign_id: campaignId || 'none',
        status,
      },
      1
    )

    registry.observeHistogram(
      'caption_generation_duration_seconds',
      durationSec,
      {
        workspace_id: workspaceId,
        campaign_id: campaignId || 'none',
      }
    )
  }

  /**
   * Track export job
   */
  static trackExportJob(workspaceId: string, status: 'completed' | 'failed') {
    registry.incrementCounter(
      'export_jobs_total',
      { workspace_id: workspaceId, status },
      1
    )
  }

  /**
   * Track cache operation (hit/miss)
   */
  static trackCacheOperation(cacheType: string, isHit: boolean) {
    if (isHit) {
      registry.incrementCounter(
        'cache_hits_total',
        { cache_type: cacheType },
        1
      )
    } else {
      registry.incrementCounter(
        'cache_misses_total',
        { cache_type: cacheType },
        1
      )
    }
  }

  /**
   * Track publishing operation
   */
  static trackPublishingOperation(
    platform: string,
    status: 'success' | 'failure',
    durationSec?: number
  ) {
    registry.incrementCounter(
      'publishing_operations_total',
      { platform, status },
      1
    )

    if (durationSec !== undefined) {
      registry.observeHistogram(
        'publishing_operation_duration_seconds',
        durationSec,
        { platform, status }
      )
    }
  }

  /**
   * Track scheduling operation
   */
  static trackSchedulingOperation(
    platform: string,
    status: 'scheduled' | 'failed'
  ) {
    registry.incrementCounter(
      'scheduling_operations_total',
      { platform, status },
      1
    )
  }

  /**
   * Track analytics retrieval
   */
  static trackAnalyticsRetrieval(
    platform: string,
    status: 'success' | 'failure'
  ) {
    registry.incrementCounter(
      'analytics_retrievals_total',
      { platform, status },
      1
    )
  }

  /**
   * Track template learning
   */
  static trackTemplateLearning(workspaceId: string, templateCount: number) {
    registry.incrementCounter(
      'template_learning_events_total',
      { workspace_id: workspaceId },
      1
    )
    registry.setGauge('active_templates_count', templateCount, {
      workspace_id: workspaceId,
    })
  }

  /**
   * Track style profile creation
   */
  static trackStyleProfileCreation(workspaceId: string, profileCount: number) {
    registry.incrementCounter(
      'style_profiles_created_total',
      { workspace_id: workspaceId },
      1
    )
    registry.setGauge('active_style_profiles_count', profileCount, {
      workspace_id: workspaceId,
    })
  }

  /**
   * Get prometheus-formatted metrics
   */
  static getMetrics(): string {
    return registry.getMetrics()
  }

  /**
   * Create a timer for measuring durations
   */
  static createTimer() {
    const start = Date.now()
    return {
      end: (labels?: {
        method?: string
        route?: string
        status_code?: string
      }) => {
        const durationSec = (Date.now() - start) / 1000
        if (labels && labels.method && labels.route && labels.status_code) {
          this.trackApiRequest(
            labels.method,
            labels.route,
            parseInt(labels.status_code),
            durationSec
          )
        }
        return durationSec
      },
    }
  }
}
