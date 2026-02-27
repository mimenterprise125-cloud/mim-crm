import { supabase } from "@/lib/supabase";

/**
 * Quick verification script to check if:
 * 1. Supabase connection works
 * 2. completed_projects table exists
 * 3. Storage bucket project-images exists
 */
export async function verifySetup() {
  try {
    console.log("🔍 Verifying Supabase setup...\n");

    // Test 1: Check if we can query the completed_projects table
    console.log("1️⃣  Checking completed_projects table...");
    const { data: projects, error: projectsError } = await supabase
      .from("completed_projects")
      .select("id, name")
      .limit(1);

    if (projectsError) {
      console.error("❌ Error accessing completed_projects table:", projectsError.message);
      return false;
    }
    console.log("✅ completed_projects table exists and is accessible");

    // Test 2: Check storage buckets
    console.log("\n2️⃣  Checking Storage buckets...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError.message);
      return false;
    }

    const projectImagesBucket = buckets?.find((b) => b.name === "project-images");
    if (projectImagesBucket) {
      console.log(`✅ 'project-images' bucket exists (Public: ${projectImagesBucket.public})`);
      if (!projectImagesBucket.public) {
        console.log("⚠️  WARNING: Bucket is not public. Images won't load on public website.");
        console.log(
          "   → Fix: Supabase Console > Storage > project-images > Policies > Make public"
        );
      }
    } else {
      console.log("❌ 'project-images' bucket NOT found");
      console.log("   → Create it: Supabase Console > Storage > New Bucket > project-images");
    }

    console.log("\n✅ Supabase setup verification complete!");
    return true;
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return false;
  }
}

// Exported for use in console or tests
