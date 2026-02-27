/**
 * Script to verify Supabase Storage bucket setup
 * Run with: npx ts-node scripts/check-storage.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  try {
    console.log("🔍 Checking Supabase Storage buckets...\n");

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError.message);
      return;
    }

    console.log("📦 Available buckets:");
    if (buckets && buckets.length > 0) {
      buckets.forEach((bucket) => {
        console.log(`  - ${bucket.name} (Public: ${bucket.public})`);
      });
    } else {
      console.log("  (No buckets found)");
    }

    // Check if project-images bucket exists
    const projectImagesBucket = buckets?.find((b) => b.name === "project-images");

    if (projectImagesBucket) {
      console.log(
        "\n✅ 'project-images' bucket exists (Public: " + projectImagesBucket.public + ")"
      );

      if (!projectImagesBucket.public) {
        console.log(
          "\n⚠️  WARNING: Bucket is NOT public. Images won't be accessible from the public website."
        );
        console.log(
          "   To fix this, go to Supabase console > Storage > project-images > Policies and make it public."
        );
      }
    } else {
      console.log("\n❌ 'project-images' bucket does NOT exist");
      console.log(
        "   You need to create it in Supabase console > Storage and make it public."
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkStorage();
