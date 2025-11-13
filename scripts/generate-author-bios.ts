#!/usr/bin/env tsx

/**
 * Script to generate author bios and website URLs using OpenAI
 * 
 * This script:
 * 1. Reads all authors from the Supabase database
 * 2. For each author with missing data (short_bio, long_bio, or website_url)
 * 3. Uses OpenAI to generate realistic author information
 * 4. Updates the database with the generated content
 * 
 * Usage:
 *   npx tsx scripts/generate-author-bios.ts
 * 
 * Environment variables required:
 *   - OPENAI_API_KEY
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Validate environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Supabase credentials are not set in environment variables');
  process.exit(1);
}

// Initialize clients
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Author = {
  id: string;
  slug: string;
  display_name: string;
  short_bio: string | null;
  long_bio: string | null;
  website_url: string | null;
};

type AuthorUpdate = {
  short_bio?: string;
  long_bio?: string;
  website_url?: string;
};

/**
 * Generate author information using OpenAI
 */
async function generateAuthorInfo(authorName: string): Promise<AuthorUpdate> {
  console.log(`  🤖 Generating content for: ${authorName}`);

  const prompt = `You are a literary database assistant. For the author named "${authorName}", provide:

1. A short bio (1-2 sentences, max 150 characters) - concise professional description
2. A long bio (2-3 paragraphs, 300-500 words) - detailed background, writing style, themes, achievements
3. A realistic website URL (if this is a real author, use their actual website; if fictional/unknown, generate a plausible URL like https://authorname.com)

If this is a real, well-known author, use accurate information. If unknown or fictional, create realistic but clearly fictional content.

Return ONLY valid JSON in this exact format with no markdown formatting:
{
  "short_bio": "string",
  "long_bio": "string",
  "website_url": "string"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates author biographies and information. Always return valid JSON without markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const result = JSON.parse(cleanContent) as AuthorUpdate;
    
    // Validate the response
    if (!result.short_bio || !result.long_bio || !result.website_url) {
      throw new Error('Incomplete response from OpenAI');
    }

    return result;
  } catch (error) {
    console.error(`  ❌ Error generating content for ${authorName}:`, error);
    throw error;
  }
}

/**
 * Update author in database
 */
async function updateAuthor(authorId: string, updates: AuthorUpdate): Promise<void> {
  const { error } = await supabase
    .from('authors')
    .update(updates)
    .eq('id', authorId);

  if (error) {
    throw new Error(`Failed to update author: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting author bio generation script...\n');

  // Fetch all authors
  console.log('📚 Fetching authors from database...');
  const { data: authors, error: fetchError } = await supabase
    .from('authors')
    .select('id, slug, display_name, short_bio, long_bio, website_url')
    .order('display_name');

  if (fetchError) {
    console.error('❌ Error fetching authors:', fetchError);
    process.exit(1);
  }

  if (!authors || authors.length === 0) {
    console.log('ℹ️  No authors found in database');
    return;
  }

  console.log(`✅ Found ${authors.length} authors\n`);

  // Process each author
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const author of authors as Author[]) {
    const needsUpdate = !author.short_bio || !author.long_bio || !author.website_url;
    
    if (!needsUpdate) {
      console.log(`⏭️  Skipping ${author.display_name} (already has complete data)`);
      skippedCount++;
      continue;
    }

    console.log(`\n📝 Processing: ${author.display_name}`);
    console.log(`   Missing: ${[
      !author.short_bio && 'short_bio',
      !author.long_bio && 'long_bio',
      !author.website_url && 'website_url',
    ].filter(Boolean).join(', ')}`);

    try {
      // Generate content
      const generatedContent = await generateAuthorInfo(author.display_name);

      // Prepare updates (only update missing fields)
      const updates: AuthorUpdate = {};
      if (!author.short_bio) updates.short_bio = generatedContent.short_bio;
      if (!author.long_bio) updates.long_bio = generatedContent.long_bio;
      if (!author.website_url) updates.website_url = generatedContent.website_url;

      // Update database
      await updateAuthor(author.id, updates);
      
      console.log(`  ✅ Successfully updated ${author.display_name}`);
      processedCount++;

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ Failed to process ${author.display_name}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully processed: ${processedCount}`);
  console.log(`   ⏭️  Skipped (complete): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📚 Total authors: ${authors.length}`);
  console.log('='.repeat(50));
}

// Run the script
main()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
