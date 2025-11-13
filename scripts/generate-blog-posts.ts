#!/usr/bin/env tsx

/**
 * Generate blog posts with OpenAI and insert them into Supabase.
 *
 * Usage:
 *   npx tsx scripts/generate-blog-posts.ts           # creates 4 posts
 *   npx tsx scripts/generate-blog-posts.ts 6        # overrides count
 *
 * Env vars required:
 *   OPENAI_API_KEY
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const POSTS_TO_CREATE = Math.max(
  1,
  Number.parseInt(process.argv[2] ?? "4", 10) || 4
);

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type GeneratedPost = {
  title: string;
  slug: string;
  dek: string;
  body: string;
  hero_image_url: string;
};

const topics = [
  "global distribution and metadata",
  "author-owned marketing funnels",
  "hybrid print + digital launches",
  "data-informed editorial planning",
  "international translation strategies",
  "pricing psychology for indie authors",
];

async function generatePost(promptTopic: string): Promise<GeneratedPost> {
  console.log(`🧠 Generating blog post about ${promptTopic}...`);

  const prompt = `You are a publishing strategist writing for the IndieConverters studio blog.
Create a blog entry about "${promptTopic}" aimed at independent authors and small imprints.

Return ONLY valid JSON (no code fences) with:
{
  "title": "...",
  "slug": "kebab-case",
  "dek": "1-2 sentence teaser",
  "body": "5-7 paragraphs (~600 words) with newline breaks between paragraphs",
  "hero_image_url": "HTTPS Unsplash image that fits the topic"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content:
          "You are an editorial assistant. Always output strict JSON without code fences.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned no content");
  }

  const clean = content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as GeneratedPost;

  if (!parsed.title || !parsed.slug || !parsed.dek || !parsed.body) {
    throw new Error("Incomplete blog payload from OpenAI");
  }

  if (!parsed.hero_image_url?.startsWith("http")) {
    parsed.hero_image_url =
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1400&q=80";
  }

  return parsed;
}

async function insertPost(post: GeneratedPost) {
  const { error } = await supabase.from("news_articles").upsert(
    {
      slug: post.slug,
      title: post.title,
      dek: post.dek,
      body: post.body,
      hero_image_url: post.hero_image_url,
      published_at: new Date().toISOString(),
      is_published: true,
      type: "blog",
    },
    { onConflict: "slug" }
  );

  if (error) {
    throw new Error(`Failed to insert ${post.slug}: ${error.message}`);
  }
}

async function main() {
  console.log(
    `🚀 Generating ${POSTS_TO_CREATE} blog posts via OpenAI + Supabase...\n`
  );
  let created = 0;
  let failed = 0;

  for (let i = 0; i < POSTS_TO_CREATE; i++) {
    const topic = topics[(i + Math.floor(Math.random() * topics.length)) % topics.length];
    try {
      const post = await generatePost(topic);
      await insertPost(post);
      console.log(`✅ Saved blog: ${post.title} (${post.slug})`);
      created++;
    } catch (error) {
      console.error("❌ Error creating blog post:", error);
      failed++;
    }
  }

  console.log(
    `\n🎉 Done. Created ${created} posts${failed ? `, ${failed} failed.` : "."}`
  );
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
