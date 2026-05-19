import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader || "" } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, payload } = await req.json();
    let result: any = {};

    if (action === "complete_chapter") {
      const { course_id, chapter_id } = payload;

      const { data: existing } = await admin
        .from("tutorial_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", course_id)
        .maybeSingle();

      const completedChapters = new Set([
        ...(existing?.completed_chapters || []),
        chapter_id,
      ]);

      const { data: allChapters } = await admin
        .from("tutorial_chapters")
        .select("id")
        .eq("course_id", course_id)
        .eq("is_published", true);

      const courseCompleted = (allChapters || []).every((ch: any) =>
        completedChapters.has(ch.id)
      );

      let certificateId = existing?.certificate_id;

      if (courseCompleted && !certificateId) {
        const { data: certIdData } = await admin.rpc("generate_certificate_id");
        certificateId = certIdData;

        const [{ data: course }, { data: profile }] = await Promise.all([
          admin.from("tutorial_courses").select("title").eq("id", course_id).single(),
          admin.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
        ]);

        const userName = [profile?.first_name, profile?.last_name]
          .filter(Boolean)
          .join(" ") || "Utilisateur";

        await admin.from("tutorial_certificates").insert({
          id: certificateId,
          user_id: user.id,
          course_id,
          course_title: course?.title || "",
          user_name: userName,
        });

        await admin
          .rpc("create_notification", {
            p_user_id: user.id,
            p_type: "system",
            p_title: "🎓 Certificat obtenu !",
            p_message: `Vous avez terminé "${course?.title}" et obtenu votre certificat !`,
            p_link: "/app/tutoriels",
          })
          .catch(() => {});
      }

      const chaptersArray = Array.from(completedChapters);

      if (existing) {
        await admin
          .from("tutorial_progress")
          .update({
            completed_chapters: chaptersArray,
            course_completed: courseCompleted,
            course_completed_at: courseCompleted ? new Date().toISOString() : null,
            certificate_id: certificateId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("tutorial_progress").insert({
          user_id: user.id,
          course_id,
          chapter_id,
          completed_chapters: chaptersArray,
          course_completed: courseCompleted,
          course_completed_at: courseCompleted ? new Date().toISOString() : null,
          certificate_id: certificateId || null,
          tutorial_slug: course_id,
        });
      }

      result = {
        success: true,
        course_completed: courseCompleted,
        certificate_id: certificateId,
        chapters_done: completedChapters.size,
        total_chapters: allChapters?.length || 0,
      };

    } else if (action === "submit_quiz") {
      const { course_id, chapter_id, answers } = payload;

      const { data: chapter } = await admin
        .from("tutorial_chapters")
        .select("quiz_questions, quiz_pass_score, title")
        .eq("id", chapter_id)
        .single();

      if (!chapter?.quiz_questions?.length) {
        throw new Error("Pas de quiz pour ce chapitre");
      }

      const questions = chapter.quiz_questions as any[];
      let correct = 0;

      const questionResults = questions.map((q: any) => {
        const userAnswer = answers[q.id];
        let isCorrect = false;

        if (q.type === "qcm" || q.type === "true_false") {
          const correctOption = q.options.find((o: any) => o.correct);
          isCorrect = userAnswer === correctOption?.value;
        } else if (q.type === "input") {
          isCorrect =
            userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim();
        }

        if (isCorrect) correct++;

        return {
          question_id: q.id,
          question: q.question,
          user_answer: userAnswer,
          correct: isCorrect,
          explanation: q.explanation,
        };
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (chapter.quiz_pass_score || 70);

      const { data: existing } = await admin
        .from("tutorial_progress")
        .select("quiz_results")
        .eq("user_id", user.id)
        .eq("course_id", course_id)
        .maybeSingle();

      const newQuizResults = {
        ...(existing?.quiz_results || {}),
        [chapter_id]: {
          score,
          passed,
          correct,
          total: questions.length,
          answers: questionResults,
          completed_at: new Date().toISOString(),
        },
      };

      if (existing) {
        await admin
          .from("tutorial_progress")
          .update({
            quiz_results: newQuizResults,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("course_id", course_id);
      } else {
        await admin.from("tutorial_progress").insert({
          user_id: user.id,
          course_id,
          quiz_results: newQuizResults,
          tutorial_slug: course_id,
        });
      }

      // If passed, mark chapter as complete
      if (passed) {
        // Re-invoke complete_chapter logic inline
        const { data: prog } = await admin
          .from("tutorial_progress")
          .select("completed_chapters")
          .eq("user_id", user.id)
          .eq("course_id", course_id)
          .maybeSingle();

        const completed = new Set([...(prog?.completed_chapters || []), chapter_id]);
        await admin
          .from("tutorial_progress")
          .update({
            completed_chapters: Array.from(completed),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("course_id", course_id);
      }

      result = {
        score,
        passed,
        correct,
        total: questions.length,
        results: questionResults,
        pass_score: chapter.quiz_pass_score || 70,
        message: passed
          ? `✅ Bravo ! ${score}% — Chapitre validé !`
          : `❌ ${score}% — Il faut ${chapter.quiz_pass_score || 70}% pour passer. Réessayez !`,
      };

    } else if (action === "get_recommendations") {
      const { data: progresses } = await admin
        .from("tutorial_progress")
        .select("*, tutorial_courses(title, category)")
        .eq("user_id", user.id);

      const completedSlugs = new Set(
        (progresses || []).filter((p: any) => p.course_completed).map((p: any) => p.course_id)
      );

      const { data: allCourses } = await admin
        .from("tutorial_courses")
        .select("id, slug, title, description, category, difficulty, order_index")
        .eq("is_published", true)
        .order("order_index");

      const recommendations = (allCourses || [])
        .filter((c: any) => !completedSlugs.has(c.id))
        .slice(0, 3)
        .map((c: any, i: number) => ({
          slug: c.slug,
          title: c.title,
          description: c.description,
          category: c.category,
          difficulty: c.difficulty,
          reason:
            i === 0
              ? "Cours suivant recommandé"
              : `Pour approfondir ${c.category}`,
          priority: i + 1,
        }));

      result = { recommendations };

    } else {
      throw new Error(`Action inconnue: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
