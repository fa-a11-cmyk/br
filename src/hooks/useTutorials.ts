import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTutorials() {
  const [courses, setCourses] = useState<any[]>([]);
  const [progresses, setProgresses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: coursesData }, { data: progressData }] = await Promise.all([
      supabase.from("tutorial_courses").select("*").eq("is_published", true).order("order_index"),
      user
        ? supabase.from("tutorial_progress").select("*").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);
    setCourses(coursesData || []);
    setProgresses(progressData || []);
    setLoading(false);
    if (user) loadRecommendations();
  };

  const loadRecommendations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/tutorial-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "get_recommendations", payload: {} }),
      });
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch { /* silent */ }
  };

  const getCourseProgress = useCallback(
    (courseId: string) => progresses.find(p => p.course_id === courseId),
    [progresses]
  );

  const getProgressPercent = useCallback(
    (courseId: string, totalChapters: number) => {
      const prog = progresses.find(p => p.course_id === courseId);
      if (!prog || !totalChapters) return 0;
      return Math.round((prog.completed_chapters?.length || 0) / totalChapters * 100);
    },
    [progresses]
  );

  const callProgress = async (action: string, payload: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/tutorial-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });
    return res.json();
  };

  const completeChapter = async (courseId: string, chapterId: string) => {
    const result = await callProgress("complete_chapter", { course_id: courseId, chapter_id: chapterId });
    setProgresses(prev => {
      const existing = prev.find(p => p.course_id === courseId);
      if (existing) {
        return prev.map(p =>
          p.course_id === courseId
            ? { ...p, completed_chapters: [...new Set([...(p.completed_chapters || []), chapterId])], course_completed: result.course_completed, certificate_id: result.certificate_id || p.certificate_id }
            : p
        );
      }
      return [...prev, { course_id: courseId, completed_chapters: [chapterId], course_completed: result.course_completed, certificate_id: result.certificate_id }];
    });
    return result;
  };

  const submitQuiz = async (courseId: string, chapterId: string, answers: Record<string, string>) => {
    return callProgress("submit_quiz", { course_id: courseId, chapter_id: chapterId, answers });
  };

  return {
    courses, progresses, recommendations, loading,
    getCourseProgress, getProgressPercent, completeChapter, submitQuiz, reload: load,
  };
}
