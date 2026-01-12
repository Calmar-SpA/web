import { createClient } from "@/lib/supabase/server"
import { B2BService } from "@calmar/database"
import { CheckoutForm } from "./checkout-form"
import { checkNewsletterDiscount } from "./actions"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const b2bService = new B2BService(supabase)
  const b2bClient = user ? await b2bService.getClientByUserId(user.id) : null
  
  // Pre-fetch newsletter discount if user exists
  const newsletterDiscount = user ? await checkNewsletterDiscount(user.email!) : null

  return <CheckoutForm user={user} b2bClient={b2bClient} initialNewsletterDiscount={newsletterDiscount} />
}
