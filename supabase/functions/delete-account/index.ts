import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Autorisation navigateur (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Récupère le token de l'utilisateur qui fait la demande
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Client admin (pour avoir le droit de supprimer)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Vérifie l'identité de l'utilisateur à partir de son token
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const userId = user.id

    // 1. Efface toutes les données liées à l'utilisateur
    await adminClient.from('conversation_reads').delete().eq('user_id', userId)
    await adminClient.from('messages').delete().eq('user_id', userId)
    await adminClient.from('participations').delete().eq('user_id', userId)
    await adminClient.from('push_tokens').delete().eq('user_id', userId)
    await adminClient.from('sorties').delete().eq('createur_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    // 2. Efface le compte de connexion lui-même
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})