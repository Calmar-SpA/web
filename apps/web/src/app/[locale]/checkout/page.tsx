import { createClient } from "@/lib/supabase/server"
import { B2BService } from "@calmar/database"
import { CheckoutForm } from "./checkout-form"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const b2bService = new B2BService(supabase)
  const b2bClient = user ? await b2bService.getClientByUserId(user.id) : null

  return <CheckoutForm user={user} b2bClient={b2bClient} />
}
