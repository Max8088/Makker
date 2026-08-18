import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) return new Response('no record', { status: 200 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: sortie } = await supabase
      .from('sorties')
      .select('id, titre, createur_id')
      .eq('id', record.sortie_id)
      .single();

    if (!sortie) return new Response('sortie not found', { status: 200 });

    if (record.user_id === sortie.createur_id) {
      return new Response('creator joined own sortie', { status: 200 });
    }

    const { data: participant } = await supabase
      .from('profiles')
      .select('prenom, nom')
      .eq('id', record.user_id)
      .single();

    const { data: tokenData } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', sortie.createur_id)
      .single();

    if (!tokenData?.token) return new Response('no token for creator', { status: 200 });

    const prenom = participant?.prenom || 'Quelquun';
    const nom = participant?.nom || '';

    const message = {
      to: tokenData.token,
      title: 'Nouveau participant',
      body: prenom + ' ' + nom + ' a rejoint "' + sortie.titre + '"',
      sound: 'default',
      data: { sortie_id: record.sortie_id, type: 'participant' },
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Expo push result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
