import { SupabaseClient } from '@supabase/supabase-js'

export type DiscountType = 'percentage' | 'fixed_amount'

export interface DiscountCode {
  id: string
  code: string
  name: string
  description?: string | null
  discount_type: DiscountType
  discount_value: number
  min_purchase_amount?: number | null
  max_discount_amount?: number | null
  usage_limit?: number | null
  usage_count?: number | null
  per_user_limit?: number | null
  first_purchase_only?: boolean | null
  starts_at?: string | null
  expires_at?: string | null
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}

interface ValidateDiscountInput {
  code: string
  userId?: string | null
  email?: string | null
  cartTotal: number
  items: Array<{ productId: string; subtotal: number }>
}

interface ValidateDiscountResult {
  isValid: boolean
  error?: string
  discountAmount?: number
  discountCode?: DiscountCode
  eligibleSubtotal?: number
}

export class DiscountCodeService {
  constructor(private supabase: SupabaseClient) {}

  async getAllDiscountCodes() {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as DiscountCode[]
  }

  async getDiscountCodeById(id: string) {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as DiscountCode
  }

  async createDiscountCode(payload: Partial<DiscountCode>) {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as DiscountCode
  }

  async updateDiscountCode(id: string, payload: Partial<DiscountCode>) {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as DiscountCode
  }

  async deleteDiscountCode(id: string) {
    const { error } = await this.supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  }

  async validateDiscountCode(input: ValidateDiscountInput): Promise<ValidateDiscountResult> {
    const normalizedCode = input.code.trim().toUpperCase()
    if (!normalizedCode) {
      return { isValid: false, error: 'Código inválido' }
    }

    const { data: discountCode, error: codeError } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (codeError || !discountCode) {
      return { isValid: false, error: 'Código no válido' }
    }

    if (!discountCode.is_active) {
      return { isValid: false, error: 'Este código no está activo' }
    }

    const now = new Date()
    if (discountCode.starts_at && new Date(discountCode.starts_at) > now) {
      return { isValid: false, error: 'Este código aún no está disponible' }
    }
    if (discountCode.expires_at && new Date(discountCode.expires_at) < now) {
      return { isValid: false, error: 'Este código ha expirado' }
    }

    if (typeof discountCode.usage_limit === 'number' && typeof discountCode.usage_count === 'number') {
      if (discountCode.usage_count >= discountCode.usage_limit) {
        return { isValid: false, error: 'Este código ya alcanzó su límite de uso' }
      }
    }

    if (typeof discountCode.min_purchase_amount === 'number') {
      if (input.cartTotal < Number(discountCode.min_purchase_amount)) {
        return {
          isValid: false,
          error: `Requiere compra mínima de $${Number(discountCode.min_purchase_amount).toLocaleString('es-CL')}`,
        }
      }
    }

    // Check user restriction
    const { data: restrictedUsers } = await this.supabase
      .from('discount_code_users')
      .select('user_id')
      .eq('discount_code_id', discountCode.id)

    if (restrictedUsers && restrictedUsers.length > 0) {
      if (!input.userId) {
        return { isValid: false, error: 'Debes iniciar sesión para usar este código' }
      }
      const isAllowedUser = restrictedUsers.some((u: any) => u.user_id === input.userId)
      if (!isAllowedUser) {
        return { isValid: false, error: 'Este código no está habilitado para tu usuario' }
      }
    }

    if (discountCode.first_purchase_only) {
      const ordersQuery = this.supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })

      if (input.userId) {
        ordersQuery.eq('user_id', input.userId)
      } else if (input.email) {
        ordersQuery.eq('email', input.email)
      }

      const { count } = await ordersQuery
      if (count && count > 0) {
        return { isValid: false, error: 'Solo válido para primera compra' }
      }
    }

    if (typeof discountCode.per_user_limit === 'number' && discountCode.per_user_limit > 0) {
      if (!input.userId) {
        return { isValid: false, error: 'Debes iniciar sesión para usar este código' }
      }
      const { count } = await this.supabase
        .from('discount_code_usages')
        .select('id', { count: 'exact', head: true })
        .eq('discount_code_id', discountCode.id)
        .eq('user_id', input.userId)

      if (count && count >= discountCode.per_user_limit) {
        return { isValid: false, error: 'Ya usaste este código' }
      }
    }

    // Check product restriction
    const { data: restrictedProducts } = await this.supabase
      .from('discount_code_products')
      .select('product_id')
      .eq('discount_code_id', discountCode.id)

    let eligibleSubtotal = input.cartTotal
    if (restrictedProducts && restrictedProducts.length > 0) {
      const allowedIds = new Set(restrictedProducts.map((p: any) => p.product_id))
      eligibleSubtotal = input.items
        .filter(item => allowedIds.has(item.productId))
        .reduce((sum, item) => sum + item.subtotal, 0)

      if (eligibleSubtotal <= 0) {
        return { isValid: false, error: 'Este código no aplica a tus productos actuales' }
      }
    }

    let discountAmount = 0
    if (discountCode.discount_type === 'percentage') {
      discountAmount = Math.floor(eligibleSubtotal * (Number(discountCode.discount_value) / 100))
      if (typeof discountCode.max_discount_amount === 'number') {
        discountAmount = Math.min(discountAmount, Number(discountCode.max_discount_amount))
      }
    } else {
      discountAmount = Math.min(Number(discountCode.discount_value), eligibleSubtotal)
    }

    if (discountAmount <= 0) {
      return { isValid: false, error: 'El descuento no es válido' }
    }

    return {
      isValid: true,
      discountAmount,
      discountCode: discountCode as DiscountCode,
      eligibleSubtotal,
    }
  }

  async applyDiscountCode(params: {
    discountCodeId: string
    orderId: string
    userId?: string | null
    discountApplied: number
  }) {
    const { data: current } = await this.supabase
      .from('discount_codes')
      .select('usage_count')
      .eq('id', params.discountCodeId)
      .single()

    const nextCount = Number(current?.usage_count || 0) + 1

    const { error: usageError } = await this.supabase
      .from('discount_code_usages')
      .insert({
        discount_code_id: params.discountCodeId,
        order_id: params.orderId,
        user_id: params.userId || null,
        discount_applied: params.discountApplied,
      })

    if (usageError) throw usageError

    const { error: updateError } = await this.supabase
      .from('discount_codes')
      .update({ usage_count: nextCount })
      .eq('id', params.discountCodeId)

    if (updateError) throw updateError

    return { success: true }
  }
}
