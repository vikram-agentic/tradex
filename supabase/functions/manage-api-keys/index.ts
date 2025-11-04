import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { action, service, key } = await req.json()

    // Get encryption key from environment (should be securely stored)
    const encryptionKey = Deno.env.get('API_KEY_ENCRYPTION_SECRET') ?? ''

    if (!encryptionKey) {
      throw new Error('Encryption key not configured')
    }

    if (action === 'save') {
      // Encrypt and save API key
      const { data: encryptedData, error: encryptError } = await supabaseClient
        .rpc('encrypt_api_key', {
          key_text: key,
          encryption_key: encryptionKey
        })

      if (encryptError) throw encryptError

      // Upsert the encrypted key
      const { error: upsertError } = await supabaseClient
        .from('api_keys')
        .upsert({
          user_id: user.id,
          service: service,
          encrypted_key: encryptedData
        }, {
          onConflict: 'user_id,service'
        })

      if (upsertError) throw upsertError

      return new Response(
        JSON.stringify({ success: true, message: 'API key saved successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'get') {
      // Retrieve and decrypt API key
      const { data: keyData, error: fetchError } = await supabaseClient
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('service', service)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No key found
          return new Response(
            JSON.stringify({ success: false, key: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw fetchError
      }

      // Decrypt the key
      const { data: decryptedKey, error: decryptError } = await supabaseClient
        .rpc('decrypt_api_key', {
          encrypted_key: keyData.encrypted_key,
          encryption_key: encryptionKey
        })

      if (decryptError) throw decryptError

      return new Response(
        JSON.stringify({ success: true, key: decryptedKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'delete') {
      // Delete API key
      const { error: deleteError } = await supabaseClient
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('service', service)

      if (deleteError) throw deleteError

      return new Response(
        JSON.stringify({ success: true, message: 'API key deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'list') {
      // List all services with API keys (without revealing the keys)
      const { data: keys, error: listError } = await supabaseClient
        .from('api_keys')
        .select('service, created_at, updated_at')
        .eq('user_id', user.id)

      if (listError) throw listError

      return new Response(
        JSON.stringify({ success: true, keys }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
