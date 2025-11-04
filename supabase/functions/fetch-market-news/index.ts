import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { symbols, keywords } = await req.json();

    // Get user's News API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('service', 'newsApi')
      .single();

    if (keyError || !apiKeyData) {
      throw new Error('News API key not configured');
    }

    // Fetch from NewsAPI
    const query = keywords || symbols?.join(' OR ') || 'stock market';
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKeyData.encrypted_key}`;

    console.log('Fetching news from NewsAPI...');
    
    const newsResponse = await fetch(newsUrl);
    
    if (!newsResponse.ok) {
      throw new Error(`NewsAPI error: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    
    if (!newsData.articles) {
      throw new Error('No articles returned from NewsAPI');
    }

    // Store news in database
    const newsToStore = newsData.articles.map((article: any) => ({
      title: article.title,
      summary: article.description,
      url: article.url,
      source: article.source.name,
      published_at: article.publishedAt,
      symbols: symbols || [],
      sentiment: null, // Could add sentiment analysis here
    }));

    // Insert news into database (ignore duplicates)
    const { error: insertError } = await supabase
      .from('market_news')
      .upsert(newsToStore, { 
        onConflict: 'url',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Error storing news:', insertError);
    }

    console.log(`Fetched ${newsData.articles.length} news articles`);

    return new Response(
      JSON.stringify({ 
        success: true,
        articles: newsData.articles,
        totalResults: newsData.totalResults,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching news:', error);
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
