import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const dailyApiKey = Deno.env.get('DAILY_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Unauthorized - No auth header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized - Invalid token');
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('Unauthorized - No user');
    }

    const { appointmentId } = await req.json();

    console.log('Creating Daily.co room for user:', user.id);

    // Create a Daily.co room
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours from now
        }
      }),
    });

    if (!dailyResponse.ok) {
      const errorData = await dailyResponse.text();
      console.error('Daily.co API error:', errorData);
      throw new Error(`Failed to create Daily.co room: ${errorData}`);
    }

    const roomData = await dailyResponse.json();
    console.log('Daily.co room created:', roomData.name);

    // Create video session in database
    const { data: session, error: dbError } = await supabase
      .from('video_sessions')
      .insert({
        user_id: user.id,
        room_id: roomData.name,
        status: 'scheduled',
        appointment_id: appointmentId || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Video session created in database:', session.id);

    return new Response(
      JSON.stringify({ 
        roomUrl: roomData.url,
        roomName: roomData.name,
        sessionId: session.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in create-video-room:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
