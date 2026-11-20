import { prisma } from "../lib/prisma";

const DAY = 24 * 60 * 60 * 1000;

export async function getDashboardStats() {
  const since = new Date(Date.now() - 29 * DAY);
  since.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    activeProducts,
    lowStock,
    outOfStock,
    totalOrders,
    pendingOrders,
    revenueAgg,
    unreadMessages,
    recentOrders,
    statusGroups,
    recentForChart,
    topItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 3 } } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Build a continuous 30-day series (zero-filled)
  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since.getTime() + i * DAY);
    buckets.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }
  for (const o of recentForChart) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.orders += 1;
      b.revenue += o.total;
    }
  }

  return {
    totals: {
      products: totalProducts,
      activeProducts,
      lowStock,
      outOfStock,
      orders: totalOrders,
      pendingOrders,
      revenue: revenueAgg._sum.total ?? 0,
      unreadMessages,
    },
    series: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
    ordersByStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    topProducts: topItems.map((t) => ({ name: t.name, units: t._sum.quantity ?? 0 })),
    recentOrders,
  };
}
