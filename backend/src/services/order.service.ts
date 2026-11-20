import { Prisma } from "@prisma/client";
import { z } from "zod";
import { publicProductWhere } from "./product.service";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta } from "../utils/http";
import { cleanOptional, cleanText } from "../utils/sanitize";
import { createOrderSchema, orderListQuery } from "../validators";

type OrderInput = z.infer<typeof createOrderSchema>;
type OrderQuery = z.infer<typeof orderListQuery>;

function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RL-${ymd}-${rand}`;
}

// Prices are always read from the database, never trusted from the client.
export async function createOrder(input: OrderInput) {
  const merged = new Map<string, number>();
  for (const item of input.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...merged.keys()] }, ...publicProductWhere() },
  });
  if (products.length !== merged.size) {
    throw ApiError.badRequest("One or more laptops in your cart are no longer available");
  }

  let total = 0;
  const lines = products.map((p) => {
    const qty = merged.get(p.id)!;
    if (p.stock < qty) {
      throw ApiError.badRequest(`Only ${p.stock} unit(s) of "${p.name}" in stock`);
    }
    const unit = p.discountPrice ?? p.price;
    total += unit * qty;
    return { productId: p.id, name: p.name, price: unit, quantity: qty };
  });

  const orderNumber = generateOrderNumber();

  return prisma.$transaction(async (tx) => {
    // Decrement stock atomically; fail if anything went out of stock meanwhile.
    for (const line of lines) {
      const res = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (res.count === 0) throw ApiError.badRequest(`"${line.name}" just went out of stock`);
    }

    return tx.order.create({
      data: {
        orderNumber,
        customerName: cleanText(input.customerName),
        customerPhone: cleanText(input.customerPhone),
        customerEmail: cleanOptional(input.customerEmail),
        address: cleanText(input.address),
        city: cleanText(input.city),
        notes: cleanOptional(input.notes),
        total,
        items: { create: lines },
      },
      include: { items: true },
    });
  });
}

export async function listOrders(q: OrderQuery) {
  const where: Prisma.OrderWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.search) {
    where.OR = [
      { orderNumber: { contains: q.search, mode: "insensitive" } },
      { customerName: { contains: q.search, mode: "insensitive" } },
      { customerPhone: { contains: q.search } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { items: true },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, meta: buildMeta(q.page, q.limit, total) };
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function updateOrderStatus(id: string, status: Prisma.OrderUpdateInput["status"]) {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw ApiError.notFound("Order not found");

  // Restock when an order is cancelled; re-deduct if a cancelled order is reopened.
  const wasCancelled = order.status === "CANCELLED";
  const willCancel = status === "CANCELLED";

  return prisma.$transaction(async (tx) => {
    if (!wasCancelled && willCancel) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
    } else if (wasCancelled && !willCancel) {
      for (const item of order.items) {
        if (item.productId) {
          const res = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count === 0) throw ApiError.badRequest(`Not enough stock to reopen this order ("${item.name}")`);
        }
      }
    }
    return tx.order.update({ where: { id }, data: { status }, include: { items: true } });
  });
}
