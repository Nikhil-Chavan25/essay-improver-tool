import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { essay, mode, tone, explainChanges, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeInstructions: Record<string, string> = {
      academic: "Use formal academic language with proper citations style and scholarly vocabulary.",
      formal: "Use professional, formal language appropriate for business or official documents.",
      creative: "Enhance creative expression while maintaining clarity. Use vivid language and varied sentence structures.",
    };

    const toneInstructions: Record<string, string> = {
      friendly: "Maintain a warm, approachable tone throughout.",
      professional: "Keep a polished, professional tone.",
      persuasive: "Make the writing more compelling and persuasive with strong arguments.",
    };

    const systemPrompt = `Act like an expert English teacher. You will improve essays by correcting grammar, improving clarity, and using better vocabulary. Keep the original meaning the same.

${modeInstructions[mode] || modeInstructions.academic}
${toneInstructions[tone] || toneInstructions.professional}

You MUST respond with valid JSON in this exact format:
{
  "improvedEssay": "the full improved essay text",
  "wordSuggestions": [
    {"original": "weak word", "suggested": "better word", "reason": "why this is better"}
  ],
  "changes": [
    {"type": "grammar|clarity|vocabulary|structure", "original": "original text", "improved": "improved text"${explainChanges ? ', "explanation": "why this change was made"' : ''}}
  ],
  "summary": "A brief 2-3 sentence summary of overall improvements made"
}

Only return the JSON, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please improve this essay:\n\n${essay}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      result = {
        improvedEssay: content,
        wordSuggestions: [],
        changes: [],
        summary: "Essay has been improved.",
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("improve-essay error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
