import { createClient } from "@/lib/supabase/server"
import { B2BService } from "@calmar/database"
import { CheckoutForm } from "./checkout-form"
import { checkNewsletterDiscount } from "./actions"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const b2bService = new B2BService(supabase)
  const b2bClient = user ? await b2bService.getClientByUserId(user.id) : null
  const b2bPrices = b2bClient?.is_active ? await b2bService.getFixedPrices(b2bClient.id) : []
  const b2bPriceMap = b2bPrices.reduce<Record<string, number>>((acc, price) => {
    acc[price.product_id] = Number(price.fixed_price)
    return acc
  }, {})
  
  // Pre-fetch newsletter discount if user exists
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('rut, full_name')
        .eq('id', user.id)
        .single()
    : { data: null }

  return (
    <CheckoutForm
      user={user}
      userProfile={profile}
      b2bClient={b2bClient}
      b2bPriceMap={b2bPriceMap}
      initialNewsletterDiscount={newsletterDiscount}
    />
  )
}
