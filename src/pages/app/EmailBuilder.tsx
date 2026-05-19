import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import TemplatePicker from "@/components/email-builder/TemplatePicker";
import GrapeEditor from "@/components/email-builder/GrapeEditor";
import { EmailTemplate } from "@/components/email-builder/EmailTemplates";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const EmailBuilder = () => {
  const { isEnabled } = useFeatureFlags();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  if (!isEnabled("email_builder")) return <Navigate to="/app/dashboard" replace />;

  if (selectedTemplate) {
    return (
      <GrapeEditor
        template={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
      />
    );
  }

  return (
    <TemplatePicker
      onSelect={setSelectedTemplate}
      onBack={() => navigate("/app/configuration")}
    />
  );
};

export default EmailBuilder;
