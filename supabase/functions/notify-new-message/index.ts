import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || record.user_id === SYSTEM_USER_ID || record.deleted) {
      return new Response('ignored', { status: 200 });
    }

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

    const { data: auteur } = await supabase
      .from('profiles')
      .select('prenom')
      .eq('id', record.user_id)
      .single();

    const { data: participations } = await supabase
      .from('participations')
      .select('user_id')
      .eq('sortie_id', record.sortie_id);

    const participantIds = (participations || []).map(p => p.user_id);
    const allRecipientIds = [...new Set([...participantIds, sortie.createur_id])];
    const recipientIds = allRecipientIds.filter(id => id !== record.user_id);

    if (recipientIds.length === 0) return new Response('no recipients', { status: 200 });

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', recipientIds);

    if (!tokens || tokens.length === 0) return new Response('no tokens', { status: 200 });

    const prenom = auteur?.prenom || 'Quelquun';
    const contenu = record.media_type === 'image'
      ? 'Photo'
      : record.media_type === 'video'
      ? 'Video'
      : record.contenu?.length > 60
      ? record.contenu.substring(0, 60) + '...'
      : record.contenu || '';

    const messages = tokens.map(({ token }) => ({
      to: token,
      title: sortie.titre,
      body: prenom + ' : ' + contenu,
      sound: 'default',
      data: { sortie_id: record.sortie_id, type: 'message' },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo push result:', JSON.stringify(result));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
