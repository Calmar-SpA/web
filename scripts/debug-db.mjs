import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load env from apps/web/.env.local
const envPath = 'd:/Aplicaciones-Desarrollos/Calmar/apps/web/.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    env[key] = value
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('sku, name, image_url')
    .eq('sku', 'CAL-HID-LIM-500')
    .single()

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('Product_in_DB:', JSON.stringify(data))
  }
}

checkProduct()
