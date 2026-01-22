'use server'

import { createClient } from '@/lib/supabase/server'
import { flow } from '@/lib/flow'
import { OrderService } from '@calmar/database'

interface ActionResult {
  success: boolean
  error?: string
  paymentUrl?: string
}

/**
 * Request return for a consignment
 * The user can only request return on consignments with status 'delivered'
 * that belong to them (enforced by RLS)
 */
export async function requestConsignmentReturn(movementId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const orderService = new OrderService(supabase)
    
    try {
      await orderService.requestConsignmentReturn(movementId)
      return { success: true }
    } catch (error: any) {
      // RLS will block if not authorized or conditions not met
      console.error('[RequestReturn] Error:', error)
      return { 
        success: false, 
        error: 'No se puede solicitar devolución para este registro' 
      }
    }
  } catch (error) {
    console.error('[RequestReturn] Critical error:', error)
    return { success: false, error: 'Error al procesar la solicitud' }
  }
}

/**
 * Initiate payment for a movement's pending balance via Flow
 */
export async function initiateMovementPayment(movementId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Get movement details (RLS ensures it belongs to user)
    const orderService = new OrderService(supabase)
    const movement = await orderService.getMovementForUser(movementId)

    if (!movement) {
      return { success: false, error: 'Registro no encontrado' }
    }

    // Validate payment can be made
    if (movement.movement_type === 'sample') {
      return { success: false, error: 'Las muestras no requieren pago' }
    }

    const remainingBalance = movement.remaining_balance || 0
    if (remainingBalance <= 0) {
      return { success: false, error: 'No hay saldo pendiente' }
    }

    // Get user email for payment
    const { data: profile } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return { success: false, error: 'No se encontró email del usuario' }
    }

    // Create Flow payment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
    
    const flowPayment = await flow.createPayment({
      commerceOrder: `MOV-${movementId}`,
      subject: `Pago ${movement.movement_number || movementId.slice(0, 8)} - Calmar`,
      amount: remainingBalance,
      email: profile.email,
      urlConfirmation: `${baseUrl}/api/payments/flow/movement-confirm`,
      urlReturn: `${baseUrl}/api/payments/flow/movement-result`,
    })

    // Store payment reference for tracking (we'll use metadata in the confirmation)
    // The movementId is embedded in the commerceOrder as MOV-{movementId}

    console.log(`[MovementPayment] Created Flow payment for movement ${movementId}, amount: ${remainingBalance}`)

    return {
      success: true,
      paymentUrl: `${flowPayment.url}?token=${flowPayment.token}`
    }

  } catch (error) {
    console.error('[MovementPayment] Critical error:', error)
    return { success: false, error: 'Error al iniciar el pago' }
  }
}
