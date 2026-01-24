import { createClient } from "@/lib/supabase/server"
import { CheckoutForm } from "./checkout-form"
import { checkNewsletterDiscount } from "./actions"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: b2bProspect } = user
    ? await supabase
        .from('prospects')
        .select('id, company_name, contact_name, email, tax_id, credit_limit, is_b2b_active, payment_terms_days, address, city, comuna, shipping_address')
        .eq('user_id', user.id)
        .eq('type', 'b2b')
        .maybeSingle()
    : { data: null }

  const { data: b2bPrices } = b2bProspect?.is_b2b_active
    ? await supabase
        .from('prospect_product_prices')
        .select('product_id, fixed_price')
        .eq('prospect_id', b2bProspect.id)
    : { data: [] }
  const b2bPriceMap = (b2bPrices || []).reduce<Record<string, number>>((acc, price) => {
    acc[price.product_id] = Number(price.fixed_price)
    return acc
  }, {})
  
  // Pre-fetch newsletter discount if user exists
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('rut, full_name, shipping_fee_exempt, address, address_number, address_extra, comuna, region')
        .eq('id', user.id)
        .single()
    : { data: null }

  return (
    <CheckoutForm
      user={user}
      userProfile={profile}
      b2bProspect={b2bProspect}
      b2bPriceMap={b2bPriceMap}
      initialNewsletterDiscount={newsletterDiscount}
    />
  )
}
