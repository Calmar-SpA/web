import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const events = await req.json()
    
    if (!Array.isArray(events)) {
      return new Response('Invalid payload', { status: 400 })
    }

    console.log(`Received ${events.length} events`)

    for (const event of events) {
      const { sg_message_id, event: eventType, timestamp, reason } = event
      
      // SendGrid message ID often comes with a suffix like .filterd, we need to strip it
      // The format is usually: <message_id>.<filter_info>
      const messageId = sg_message_id?.split('.')[0]

      if (!messageId) continue

      const updateData: any = {}
      const eventDate = new Date(timestamp * 1000).toISOString()

      // Priority logic: opened > delivered > sent
      // We don't want to revert status from 'opened' to 'delivered' if events arrive out of order
      // But we can update timestamps always

      switch (eventType) {
        case 'delivered':
          updateData.status = 'delivered'
          updateData.delivered_at = eventDate
          break
        case 'open':
          updateData.status = 'opened'
          updateData.opened_at = eventDate
          break
        case 'bounce':
          updateData.status = 'bounced'
          updateData.bounced_at = eventDate
          updateData.error_message = reason
          break
        case 'dropped':
          updateData.status = 'failed'
          updateData.error_message = reason
          break
        default:
          // Other events like 'processed', 'deferred', 'click', 'spamreport', 'unsubscribe', 'group_unsubscribe', 'group_resubscribe'
          continue
      }

      if (Object.keys(updateData).length > 0) {
        // We check current status to avoid downgrading status (e.g. opened -> delivered)
        // But we always update timestamps
        
        const { data: currentLog } = await supabase
          .from('email_logs')
          .select('status')
          .eq('sendgrid_message_id', messageId)
          .single()

        if (currentLog) {
          // Prevent status downgrade
          if (currentLog.status === 'opened' && updateData.status === 'delivered') {
            delete updateData.status
          }
          if (currentLog.status === 'bounced' || currentLog.status === 'failed') {
             // Terminal states, usually don't change, but if we get an open event after bounce (weird but possible), we might want to update
             if (updateData.status === 'delivered') delete updateData.status
          }

          const { error } = await supabase
            .from('email_logs')
            .update(updateData)
            .eq('sendgrid_message_id', messageId)

          if (error) {
            console.error(`Error updating log for message ${messageId}:`, error)
          } else {
            console.log(`Updated log for message ${messageId} with status ${updateData.status || 'unchanged'}`)
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
