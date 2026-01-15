import { sendLowInventoryAdminAlert } from "@/lib/mail";

export interface OrderItemStockInput {
  product_id: string;
  variant_id?: string | null;
  product_name?: string | null;
  variant_name?: string | null;
  quantity?: number | null;
}

export const LOW_STOCK_THRESHOLD = 10;

export async function notifyLowInventoryIfNeeded(
  supabase: any,
  items: OrderItemStockInput[],
  threshold: number = LOW_STOCK_THRESHOLD
) {
  if (!items.length) return;

  const productIds = Array.from(
    new Set(items.map(item => item.product_id).filter(Boolean))
  );

  if (!productIds.length) return;

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, variants(id, name, stock_quantity)')
    .in('id', productIds);

  if (error || !products) {
    console.warn('Low inventory check failed', error);
    return;
  }

  const lowItems = items
    .map(item => {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) return null;

      const variant = item.variant_id
        ? product.variants?.find((v: any) => v.id === item.variant_id)
        : null;

      const stockQuantity = variant?.stock_quantity;
      if (typeof stockQuantity !== 'number') return null;

      if (stockQuantity > threshold) return null;

      return {
        productName: product.name || item.product_name || 'Producto',
        variantName: variant?.name || item.variant_name || null,
        stockQuantity,
      };
    })
    .filter(Boolean);

  if (!lowItems.length) return;

  await sendLowInventoryAdminAlert({
    threshold,
    items: lowItems as any,
  });
}
