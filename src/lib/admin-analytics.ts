import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status'
import { prisma } from '@/lib/prisma'

export type AnalyticsIntegration = {
  id: string
  name: string
  description: string
  enabled: boolean
  status: 'active' | 'configured' | 'missing'
  dashboardUrl: string | null
  detail?: string
  notes?: string[]
}

export type PeriodMetric = {
  last7d: number
  prev7d: number
  change7d: number | null
  last30d: number
  prev30d: number
  change30d: number | null
}

export type SummaryKpi = {
  id: string
  label: string
  value: number
  format: 'number' | 'currency' | 'percent'
  periods: PeriodMetric
  hint?: string
}

export type FunnelStep = {
  id: string
  label: string
  eventName: string
  count: number
  last7d: number
  last30d: number
  conversionFromPrevious: number | null
  dropOffFromPrevious: number | null
  overallFromSignup: number | null
}

export type FunnelDropOff = {
  fromLabel: string
  toLabel: string
  retained: number
  lost: number
  retentionRate: number | null
  dropOffRate: number | null
}

export type OrderStatusCount = {
  status: string
  label: string
  count: number
  share: number
}

export type DailyTrendPoint = {
  date: string
  signups: number
  sellers: number
  gigs: number
  orders: number
  completedOrders: number
  revenue: number
}

export type WeeklyTrendPoint = {
  weekStart: string
  signups: number
  orders: number
  completedOrders: number
  revenue: number
}

export type CategoryMetric = {
  category: string
  orders: number
  revenue: number
  share: number
}

export type RecentSignup = {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
}

export type RecentOrder = {
  id: string
  status: string
  price: number
  buyerName: string | null
  gigTitle: string | null
  createdAt: string
}

export type UserBreakdown = {
  buyers: number
  sellers: number
  admins: number
  activeSellers: number
  sellersWithGigs: number
  buyersWithOrders: number
  repeatBuyers: number
  repeatBuyerRate: number | null
}

export type RevenueMetrics = {
  grossRevenue: number
  revenue7d: number
  revenue30d: number
  avgOrderValue: number
  avgOrderValue7d: number
  cancellationRate: number | null
  checkoutToPaymentRate: number | null
  paymentToCompletedRate: number | null
  signupToCompletedRate: number | null
}

export type AdminAnalyticsPayload = {
  generatedAt: string
  siteUrl: string
  integrations: AnalyticsIntegration[]
  summary: SummaryKpi[]
  userBreakdown: UserBreakdown
  revenue: RevenueMetrics
  orderStatus: OrderStatusCount[]
  funnel: FunnelStep[]
  funnelDropOffs: FunnelDropOff[]
  dailyTrends: DailyTrendPoint[]
  weeklyTrends: WeeklyTrendPoint[]
  topCategories: CategoryMetric[]
  recentSignups: RecentSignup[]
  recentOrders: RecentOrder[]
  trackedEvents: Array<{ name: string; description: string; source: string; destinations: string }>
}

const TRACKED_EVENTS = [
  {
    name: 'signup_completed',
    description: 'User finished registration',
    source: '/signup',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
  {
    name: 'become_seller',
    description: 'Buyer upgraded to seller',
    source: '/profile',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
  {
    name: 'gig_created',
    description: 'Seller published a new gig',
    source: '/create-gig',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
  {
    name: 'checkout_started',
    description: 'Buyer opened checkout',
    source: '/checkout/[gigId]',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
  {
    name: 'payment_initiated',
    description: 'Wompi payment flow started',
    source: '/checkout/[gigId]',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
  {
    name: 'payment_completed',
    description: 'Order marked paid or completed',
    source: '/checkout, /orders',
    destinations: 'Vercel (always) · GA4 (with consent)',
  },
] as const

const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending',
  Paid: 'Paid',
  In_Progress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function changePct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function sumRevenue(orders: Array<{ price: number }>): number {
  return orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0)
}

function buildPeriodMetric(
  countInRange: (start: Date, end?: Date) => Promise<number>
): Promise<PeriodMetric> {
  const last7dStart = daysAgo(7)
  const prev7dStart = daysAgo(14)
  const last30dStart = daysAgo(30)
  const prev30dStart = daysAgo(60)

  return Promise.all([
    countInRange(last7dStart),
    countInRange(prev7dStart, last7dStart),
    countInRange(last30dStart),
    countInRange(prev30dStart, last30dStart),
  ]).then(([last7d, prev7d, last30d, prev30d]) => ({
    last7d,
    prev7d,
    change7d: changePct(last7d, prev7d),
    last30d,
    prev30d,
    change30d: changePct(last30d, prev30d),
  }))
}

function buildDailyTrends(
  signups: Array<{ createdAt: Date; role: string }>,
  gigs: Array<{ createdAt: Date }>,
  orders: Array<{ createdAt: Date; status: string; price: number }>,
  completedStatus: string
): DailyTrendPoint[] {
  const days = 30
  const buckets = new Map<string, DailyTrendPoint>()

  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      signups: 0,
      sellers: 0,
      gigs: 0,
      orders: 0,
      completedOrders: 0,
      revenue: 0,
    })
  }

  for (const user of signups) {
    const key = user.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.signups += 1
    if (user.role === 'seller') bucket.sellers += 1
  }

  for (const gig of gigs) {
    const key = gig.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (bucket) bucket.gigs += 1
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.orders += 1
    if (order.status === completedStatus) {
      bucket.completedOrders += 1
      bucket.revenue += Number(order.price) || 0
    }
  }

  return Array.from(buckets.values())
}

function buildWeeklyTrends(daily: DailyTrendPoint[]): WeeklyTrendPoint[] {
  const weeks = new Map<string, WeeklyTrendPoint>()

  for (const day of daily) {
    const d = new Date(day.date)
    const dayOfWeek = d.getDay()
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - dayOfWeek)
    const key = weekStart.toISOString().slice(0, 10)

    if (!weeks.has(key)) {
      weeks.set(key, {
        weekStart: key,
        signups: 0,
        orders: 0,
        completedOrders: 0,
        revenue: 0,
      })
    }

    const week = weeks.get(key)!
    week.signups += day.signups
    week.orders += day.orders
    week.completedOrders += day.completedOrders
    week.revenue += day.revenue
  }

  return Array.from(weeks.values())
}

function buildFunnelDropOffs(steps: FunnelStep[]): FunnelDropOff[] {
  const dropOffs: FunnelDropOff[] = []
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1]
    const curr = steps[i]
    const retained = curr.count
    const lost = Math.max(prev.count - curr.count, 0)
    dropOffs.push({
      fromLabel: prev.label,
      toLabel: curr.label,
      retained,
      lost,
      retentionRate: pct(retained, prev.count),
      dropOffRate: pct(lost, prev.count),
    })
  }
  return dropOffs
}

export function getAnalyticsIntegrations(): AnalyticsIntegration[] {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  const vercelAnalyticsUrl =
    process.env.ADMIN_VERCEL_ANALYTICS_URL?.trim() || 'https://vercel.com/dashboard'
  const vercelSpeedUrl =
    process.env.ADMIN_VERCEL_SPEED_INSIGHTS_URL?.trim() || vercelAnalyticsUrl
  const gaDashboardUrl =
    process.env.ADMIN_GA_DASHBOARD_URL?.trim() || 'https://analytics.google.com/'

  return [
    {
      id: 'vercel-analytics',
      name: 'Vercel Web Analytics',
      description: 'Page views, unique visitors, referrers, and custom events',
      enabled: true,
      status: 'active',
      dashboardUrl: vercelAnalyticsUrl,
      detail: 'Always on via <Analytics /> in root layout',
      notes: [
        'Receives all trackEvent() calls regardless of cookie consent',
        'Custom events: signup, seller, gig, checkout, payment',
      ],
    },
    {
      id: 'vercel-speed-insights',
      name: 'Vercel Speed Insights',
      description: 'Real User Monitoring — LCP, FID, CLS, TTFB',
      enabled: true,
      status: 'active',
      dashboardUrl: vercelSpeedUrl,
      detail: 'Always on via <SpeedInsights /> in root layout',
      notes: ['Aggregated per deployment and route', 'No PII collected'],
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics 4',
      description: 'Consent-gated traffic and funnel event analytics',
      enabled: !!gaId,
      status: gaId ? 'configured' : 'missing',
      dashboardUrl: gaDashboardUrl,
      detail: gaId ? `Measurement ID: ${gaId}` : 'Set NEXT_PUBLIC_GA_MEASUREMENT_ID',
      notes: gaId
        ? [
            'Only loads after user accepts analytics cookies',
            'Mirrors the same custom events sent to Vercel',
          ]
        : ['GA4 script is not injected until measurement ID is configured'],
    },
  ]
}

async function countGigs(where: { deletedAt: null; createdAt?: { gte: Date } } | { createdAt: { gte: Date } }) {
  try {
    return await prisma.gig.count({ where: where as { deletedAt: null; createdAt?: { gte: Date } } })
  } catch {
    const { deletedAt: _, ...rest } = where as { deletedAt: null; createdAt?: { gte: Date } }
    return await prisma.gig.count({ where: rest })
  }
}

async function countGigsBetween(start: Date, end?: Date) {
  const createdAt = end ? { gte: start, lt: end } : { gte: start }
  return countGigs({ deletedAt: null, createdAt })
}

export async function buildAdminAnalyticsPayload(): Promise<AdminAnalyticsPayload> {
  const now = new Date()
  const last7d = daysAgo(7)
  const last30d = daysAgo(30)
  const completedStatus = labelToPrismaStatus(OrderStatusLabel.Completed)
  const pendingStatus = labelToPrismaStatus(OrderStatusLabel.Pending)
  const cancelledStatus = labelToPrismaStatus(OrderStatusLabel.Cancelled)
  const paidStatuses = [
    labelToPrismaStatus(OrderStatusLabel.Paid),
    labelToPrismaStatus(OrderStatusLabel.InProgress),
    completedStatus,
  ]
  const notPending = { not: pendingStatus }

  const [
    totalSignups,
    signups7d,
    signups30d,
    totalSellers,
    sellers7d,
    sellers30d,
    totalGigs,
    gigs7d,
    gigs30d,
    activeGigs,
    totalCheckouts,
    checkouts7d,
    checkouts30d,
    totalPayments,
    payments7d,
    payments30d,
    totalCompleted,
    completed7d,
    completed30d,
    totalOrders,
    totalCancelled,
    totalBuyers,
    totalAdmins,
    trendUsers,
    recentGigs,
    recentOrdersRaw,
    completedOrdersForRevenue,
    completedOrdersDetailed,
    sellersWithGigRows,
    buyerOrderCounts,
    orderStatusGroups,
    signupPeriods,
    orderPeriods,
    completedPeriods,
    revenuePeriods,
    latestSignups,
    latestOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7d } } }),
    prisma.user.count({ where: { createdAt: { gte: last30d } } }),
    prisma.user.count({ where: { role: 'seller' } }),
    prisma.user.count({ where: { role: 'seller', createdAt: { gte: last7d } } }),
    prisma.user.count({ where: { role: 'seller', createdAt: { gte: last30d } } }),
    countGigs({ deletedAt: null }),
    countGigs({ deletedAt: null, createdAt: { gte: last7d } }),
    countGigs({ deletedAt: null, createdAt: { gte: last30d } }),
    countGigs({ deletedAt: null }).then(async (total) => {
      try {
        return await prisma.gig.count({ where: { isActive: true, deletedAt: null } })
      } catch {
        return total
      }
    }),
    prisma.order.count({ where: { status: notPending } }),
    prisma.order.count({ where: { status: notPending, createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { status: notPending, createdAt: { gte: last30d } } }),
    prisma.order.count({ where: { status: { in: paidStatuses } } }),
    prisma.order.count({ where: { status: { in: paidStatuses }, createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { status: { in: paidStatuses }, createdAt: { gte: last30d } } }),
    prisma.order.count({ where: { status: completedStatus } }),
    prisma.order.count({ where: { status: completedStatus, createdAt: { gte: last7d } } }),
    prisma.order.count({ where: { status: completedStatus, createdAt: { gte: last30d } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: cancelledStatus } }),
    prisma.user.count({ where: { role: 'buyer' } }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.user.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true, role: true },
    }),
    prisma.gig.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true, status: true, price: true },
    }),
    prisma.order.findMany({
      where: { status: completedStatus },
      select: { price: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { status: completedStatus },
      select: {
        price: true,
        buyerId: true,
        gig: { select: { category: true } },
      },
    }),
    prisma.gig.groupBy({
      by: ['sellerId'],
      where: { deletedAt: null },
      _count: { id: true },
    }).catch(() => [] as Array<{ sellerId: string; _count: { id: number } }>),
    prisma.order.groupBy({
      by: ['buyerId'],
      where: { status: completedStatus },
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    buildPeriodMetric((start, end) =>
      prisma.user.count({
        where: end ? { createdAt: { gte: start, lt: end } } : { createdAt: { gte: start } },
      })
    ),
    buildPeriodMetric((start, end) =>
      prisma.order.count({
        where: end
          ? { status: notPending, createdAt: { gte: start, lt: end } }
          : { status: notPending, createdAt: { gte: start } },
      })
    ),
    buildPeriodMetric((start, end) =>
      prisma.order.count({
        where: end
          ? { status: completedStatus, createdAt: { gte: start, lt: end } }
          : { status: completedStatus, createdAt: { gte: start } },
      })
    ),
    buildPeriodMetric(async (start, end) => {
      const orders = await prisma.order.findMany({
        where: end
          ? { status: completedStatus, createdAt: { gte: start, lt: end } }
          : { status: completedStatus, createdAt: { gte: start } },
        select: { price: true },
      })
      return sumRevenue(orders)
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
        buyer: { select: { name: true } },
        gig: { select: { title: true } },
      },
    }),
  ])

  const grossRevenue = sumRevenue(completedOrdersForRevenue)
  const revenue7d = sumRevenue(
    completedOrdersForRevenue.filter((o: { createdAt: Date }) => o.createdAt >= last7d)
  )
  const revenue30d = sumRevenue(
    completedOrdersForRevenue.filter((o: { createdAt: Date }) => o.createdAt >= last30d)
  )
  const completed7dOrders = completedOrdersForRevenue.filter(
    (o: { createdAt: Date }) => o.createdAt >= last7d
  )
  const avgOrderValue = totalCompleted > 0 ? grossRevenue / totalCompleted : 0
  const avgOrderValue7d =
    completed7dOrders.length > 0 ? sumRevenue(completed7dOrders) / completed7dOrders.length : 0

  const buyersWithOrders = buyerOrderCounts.length
  const repeatBuyers = buyerOrderCounts.filter(
    (b: { _count: { id: number } }) => b._count.id > 1
  ).length

  const categoryMap = new Map<string, { orders: number; revenue: number }>()
  for (const order of completedOrdersDetailed) {
    const cat = order.gig?.category || 'Uncategorized'
    const price = Number(order.price) || 0
    const entry = categoryMap.get(cat) ?? { orders: 0, revenue: 0 }
    entry.orders += 1
    entry.revenue += price
    categoryMap.set(cat, entry)
  }
  const topCategories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      orders: data.orders,
      revenue: data.revenue,
      share: pct(data.orders, totalCompleted) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const funnel: FunnelStep[] = [
    {
      id: 'signup',
      label: 'Signups',
      eventName: 'signup_completed',
      count: totalSignups,
      last7d: signups7d,
      last30d: signups30d,
      conversionFromPrevious: null,
      dropOffFromPrevious: null,
      overallFromSignup: 100,
    },
    {
      id: 'seller',
      label: 'Sellers',
      eventName: 'become_seller',
      count: totalSellers,
      last7d: sellers7d,
      last30d: sellers30d,
      conversionFromPrevious: pct(totalSellers, totalSignups),
      dropOffFromPrevious: pct(totalSignups - totalSellers, totalSignups),
      overallFromSignup: pct(totalSellers, totalSignups),
    },
    {
      id: 'gig',
      label: 'Gigs created',
      eventName: 'gig_created',
      count: totalGigs,
      last7d: gigs7d,
      last30d: gigs30d,
      conversionFromPrevious: pct(totalGigs, totalSellers),
      dropOffFromPrevious: pct(totalSellers - totalGigs, totalSellers),
      overallFromSignup: pct(totalGigs, totalSignups),
    },
    {
      id: 'checkout',
      label: 'Checkouts started',
      eventName: 'checkout_started',
      count: totalCheckouts,
      last7d: checkouts7d,
      last30d: checkouts30d,
      conversionFromPrevious: pct(totalCheckouts, totalGigs),
      dropOffFromPrevious: pct(totalGigs - totalCheckouts, totalGigs),
      overallFromSignup: pct(totalCheckouts, totalSignups),
    },
    {
      id: 'payment',
      label: 'Payments initiated',
      eventName: 'payment_initiated',
      count: totalPayments,
      last7d: payments7d,
      last30d: payments30d,
      conversionFromPrevious: pct(totalPayments, totalCheckouts),
      dropOffFromPrevious: pct(totalCheckouts - totalPayments, totalCheckouts),
      overallFromSignup: pct(totalPayments, totalSignups),
    },
    {
      id: 'completed',
      label: 'Payments completed',
      eventName: 'payment_completed',
      count: totalCompleted,
      last7d: completed7d,
      last30d: completed30d,
      conversionFromPrevious: pct(totalCompleted, totalPayments),
      dropOffFromPrevious: pct(totalPayments - totalCompleted, totalPayments),
      overallFromSignup: pct(totalCompleted, totalSignups),
    },
  ]

  const dailyTrends = buildDailyTrends(trendUsers, recentGigs, recentOrdersRaw, completedStatus)

  const [gigsPrev7d, gigsPrev30d] = await Promise.all([
    countGigsBetween(daysAgo(14), daysAgo(7)),
    countGigsBetween(daysAgo(60), daysAgo(30)),
  ])

  const orderStatus: OrderStatusCount[] = orderStatusGroups
    .map((g: { status: string; _count: { id: number } }) => ({
      status: g.status,
      label: ORDER_STATUS_LABELS[g.status] ?? g.status,
      count: g._count.id,
      share: pct(g._count.id, totalOrders) ?? 0,
    }))
    .sort((a: OrderStatusCount, b: OrderStatusCount) => b.count - a.count)

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return {
    generatedAt: now.toISOString(),
    siteUrl,
    integrations: getAnalyticsIntegrations(),
    summary: [
      {
        id: 'signups',
        label: 'New signups',
        value: totalSignups,
        format: 'number',
        periods: signupPeriods,
        hint: 'All registered users',
      },
      {
        id: 'orders',
        label: 'Checkouts',
        value: totalCheckouts,
        format: 'number',
        periods: orderPeriods,
        hint: 'Non-pending orders',
      },
      {
        id: 'completed',
        label: 'Completed orders',
        value: totalCompleted,
        format: 'number',
        periods: completedPeriods,
        hint: 'Successfully fulfilled',
      },
      {
        id: 'revenue',
        label: 'Gross revenue',
        value: grossRevenue,
        format: 'currency',
        periods: revenuePeriods,
        hint: 'Sum of completed order prices',
      },
      {
        id: 'gigs',
        label: 'Active gigs',
        value: activeGigs,
        format: 'number',
        periods: {
          last7d: gigs7d,
          prev7d: gigsPrev7d,
          change7d: changePct(gigs7d, gigsPrev7d),
          last30d: gigs30d,
          prev30d: gigsPrev30d,
          change30d: changePct(gigs30d, gigsPrev30d),
        },
        hint: `${totalGigs} total gigs published`,
      },
      {
        id: 'aov',
        label: 'Avg order value',
        value: avgOrderValue,
        format: 'currency',
        periods: {
          last7d: avgOrderValue7d,
          prev7d: 0,
          change7d: null,
          last30d: totalCompleted > 0 ? revenue30d / Math.max(completed30d, 1) : 0,
          prev30d: 0,
          change30d: null,
        },
        hint: 'Completed orders only',
      },
    ],
    userBreakdown: {
      buyers: totalBuyers,
      sellers: totalSellers,
      admins: totalAdmins,
      activeSellers: totalSellers,
      sellersWithGigs: sellersWithGigRows.length,
      buyersWithOrders,
      repeatBuyers,
      repeatBuyerRate: pct(repeatBuyers, buyersWithOrders),
    },
    revenue: {
      grossRevenue,
      revenue7d,
      revenue30d,
      avgOrderValue,
      avgOrderValue7d,
      cancellationRate: pct(totalCancelled, totalOrders),
      checkoutToPaymentRate: pct(totalPayments, totalCheckouts),
      paymentToCompletedRate: pct(totalCompleted, totalPayments),
      signupToCompletedRate: pct(totalCompleted, totalSignups),
    },
    orderStatus,
    funnel,
    funnelDropOffs: buildFunnelDropOffs(funnel),
    dailyTrends,
    weeklyTrends: buildWeeklyTrends(dailyTrends),
    topCategories,
    recentSignups: latestSignups.map((u: (typeof latestSignups)[number]) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    })),
    recentOrders: latestOrders.map((o: (typeof latestOrders)[number]) => ({
      id: o.id,
      status: ORDER_STATUS_LABELS[o.status] ?? o.status,
      price: Number(o.price) || 0,
      buyerName: o.buyer?.name ?? null,
      gigTitle: o.gig?.title ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
    trackedEvents: TRACKED_EVENTS.map((e) => ({ ...e })),
  }
}