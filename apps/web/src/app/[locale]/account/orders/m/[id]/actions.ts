'use server'

import { createClient } from '@/lib/supabase/server'
import { flow } from '@/lib/flow'
import { OrderService } from '@calmar/database'
import { revalidatePath } from 'next/cache'
import { sendOrderPaidAdminEmail } from '@/lib/mail'

interface ActionResult {
  success: boolean
  error?: string
  paymentUrl?: string
}

/**
 * Submit a transfer payment proof
 */
export async function submitTransferPayment(
  movementId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const file = formData.get('file') as File
    const amount = parseFloat(formData.get('amount') as string)
    const reference = formData.get('reference') as string
    const notes = formData.get('notes') as string

    if (!file) {
      return { success: false, error: 'El comprobante es requerido' }
    }

    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${movementId}-${Date.now()}.${fileExt}`
    const filePath = `proofs/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file)

    if (uploadError) {
      console.error('[TransferPayment] Upload error:', uploadError)
      return { success: false, error: 'Error al subir el comprobante' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    // 2. Create movement payment record
    const { error: paymentError } = await supabase
      .from('movement_payments')
      .insert({
        movement_id: movementId,
        amount,
        payment_method: 'transfer',
        payment_reference: reference,
        notes,
        payment_proof_url: publicUrl,
        verification_status: 'pending',
        created_by: user.id
      })

    if (paymentError) {
      console.error('[TransferPayment] DB error:', paymentError)
      return { success: false, error: 'Error al registrar el pago' }
    }

    // 3. Notify admin
    const orderService = new OrderService(supabase)
    const movement = await orderService.getMovementForUser(movementId)
    
    // We'll use a dynamic import or just call the admin notification if available
    // For now, let's assume we can use a simpler notification or the existing one
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
      const adminUrl = `${baseUrl}/crm/payments`
      
      // Since we are in apps/web, we might not have access to apps/admin/lib/mail
      // But let's check if we can use the web's mail lib to notify admin
      await sendOrderPaidAdminEmail({
        orderNumber: movement.movement_number || movement.id.slice(0, 8),
        customerName: user.email || 'Cliente',
        customerEmail: user.email || '',
        totalAmount: amount,
        paymentMethod: `Transferencia (Pendiente Verificación) - Ver en: ${adminUrl}`,
        shippingSummary: 'N/A (Pago de Movimiento)',
      })
    } catch (mailError) {
      console.error('[TransferPayment] Mail notification error:', mailError)
    }

    revalidatePath(`/account/orders/m/${movementId}`)
    revalidatePath(`/es/account/orders/m/${movementId}`)

    return { success: true }
  } catch (error) {
    console.error('[TransferPayment] Critical error:', error)
    return { success: false, error: 'Error al procesar el pago' }
  }
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
