export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  html: string;
  css: string;
}

const baseStyles = `
  body { margin: 0; padding: 0; font-family: 'DM Sans', Arial, sans-serif; background-color: #f5f5fa; }
  .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
  .header { background: linear-gradient(135deg, #E91E8C, #7C3AED); padding: 32px 24px; text-align: center; }
  .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0; }
  .content { padding: 32px 24px; }
  .content h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 12px; font-weight: 700; }
  .content p { color: #55556A; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
  .block { background: #F8F8FC; border-radius: 10px; padding: 20px; margin: 16px 0; }
  .block-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9898B0; margin: 0 0 10px; font-family: 'DM Mono', monospace; }
  .task-item { font-size: 14px; color: #1a1a2e; padding: 4px 0; }
  .btn-cta { display: inline-block; background: linear-gradient(135deg, #E91E8C, #7C3AED); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; }
  .footer { padding: 24px; text-align: center; border-top: 1px solid #E8E8EC; }
  .footer p { color: #9898B0; font-size: 11px; margin: 4px 0; }
  .sentiment-bar { height: 8px; border-radius: 4px; background: #E8E8EC; overflow: hidden; margin-top: 8px; }
  .sentiment-fill { height: 100%; border-radius: 4px; background: #10B981; }
`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "rapport-reunion",
    name: "Rapport de réunion",
    description: "Template standard pour les comptes-rendus post-réunion",
    emoji: "📋",
    html: `<div class="email-wrapper">
  <div class="header">
    <h1>RapidoMeet ™</h1>
    <p>Compte-rendu automatique</p>
  </div>
  <div class="content">
    <h2>{{meeting_title}}</h2>
    <p>📅 {{meeting_date}} · {{meeting_duration}} · {{participants_count}} participants</p>
    <div class="block">
      <p class="block-title">Résumé exécutif</p>
      <p>{{ai_summary}}</p>
    </div>
    <div class="block">
      <p class="block-title">✅ Tâches assignées ({{tasks_count}})</p>
      <p class="task-item">☐ {{task_1_title}} → {{task_1_assignee}}</p>
      <p class="task-item">☐ {{task_2_title}} → {{task_2_assignee}}</p>
    </div>
    <div class="block">
      <p class="block-title">📋 Décisions ({{decisions_count}})</p>
      <p class="task-item">→ {{decision_1}}</p>
      <p class="task-item">→ {{decision_2}}</p>
    </div>
    <div style="text-align: center; padding: 24px 0;">
      <a href="#" class="btn-cta">Voir le rapport complet →</a>
    </div>
  </div>
  <div class="footer">
    <p>© {{year}} {{company_name}} · Généré par RapidoMeet</p>
    <p>Se désabonner · Politique de confidentialité</p>
  </div>
</div>`,
    css: baseStyles,
  },
  {
    id: "prospect-commercial",
    name: "Suivi prospect",
    description: "Email de suivi après un appel commercial",
    emoji: "💼",
    html: `<div class="email-wrapper">
  <div class="header">
    <h1>RapidoMeet ™</h1>
    <p>Suivi commercial automatique</p>
  </div>
  <div class="content">
    <h2>Bonjour {{prospect_name}},</h2>
    <p>Suite à notre échange du {{meeting_date}}, voici un récapitulatif des points abordés et des prochaines étapes.</p>
    <div class="block">
      <p class="block-title">🎯 Points clés discutés</p>
      <p>{{ai_summary}}</p>
    </div>
    <div class="block">
      <p class="block-title">📊 Score d'intérêt</p>
      <p style="font-size: 28px; font-weight: 800; color: #E91E8C; margin: 0;">{{prospect_score}}/10</p>
    </div>
    <div class="block">
      <p class="block-title">📅 Prochaines étapes</p>
      <p class="task-item">→ {{next_step_1}}</p>
      <p class="task-item">→ {{next_step_2}}</p>
    </div>
    <div style="text-align: center; padding: 24px 0;">
      <a href="#" class="btn-cta">Planifier un rendez-vous →</a>
    </div>
  </div>
  <div class="footer">
    <p>{{sender_name}} · {{sender_company}}</p>
    <p>{{sender_email}} · {{sender_phone}}</p>
  </div>
</div>`,
    css: baseStyles,
  },
  {
    id: "weekly-digest",
    name: "Weekly Digest",
    description: "Récapitulatif hebdomadaire de toutes les réunions",
    emoji: "📊",
    html: `<div class="email-wrapper">
  <div class="header">
    <h1>📊 Weekly Digest</h1>
    <p>Semaine du {{week_start}} au {{week_end}}</p>
  </div>
  <div class="content">
    <h2>Bonjour {{user_name}},</h2>
    <p>Voici le récapitulatif de votre semaine avec {{meetings_count}} réunions analysées.</p>
    <div class="block">
      <p class="block-title">📈 Statistiques de la semaine</p>
      <p class="task-item">🎙 {{meetings_count}} réunions transcrites</p>
      <p class="task-item">✅ {{tasks_total}} tâches extraites</p>
      <p class="task-item">📋 {{decisions_total}} décisions prises</p>
      <p class="task-item">⏱ {{time_saved}} heures économisées</p>
    </div>
    <div class="block">
      <p class="block-title">⚠️ Tâches en retard</p>
      <p class="task-item">🔴 {{overdue_task_1}}</p>
      <p class="task-item">🔴 {{overdue_task_2}}</p>
    </div>
    <div class="block">
      <p class="block-title">😊 Sentiment moyen</p>
      <p style="color: #1a1a2e;">{{sentiment_score}}% Positif</p>
      <div class="sentiment-bar"><div class="sentiment-fill" style="width: 82%;"></div></div>
    </div>
    <div style="text-align: center; padding: 24px 0;">
      <a href="#" class="btn-cta">Voir le dashboard complet →</a>
    </div>
  </div>
  <div class="footer">
    <p>© {{year}} {{company_name}} · Généré par RapidoMeet</p>
    <p>Se désabonner · Préférences de notification</p>
  </div>
</div>`,
    css: baseStyles,
  },
  {
    id: "alerte-sentiment",
    name: "Alerte Sentiment",
    description: "Notification quand le sentiment d'une réunion est négatif",
    emoji: "⚠️",
    html: `<div class="email-wrapper">
  <div style="background: linear-gradient(135deg, #EF4444, #F59E0B); padding: 32px 24px; text-align: center;">
    <h1 style="color: #fff; font-size: 22px; margin: 0;">⚠️ Alerte Sentiment</h1>
    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0;">Réunion à surveiller</p>
  </div>
  <div class="content">
    <h2>{{meeting_title}}</h2>
    <p>Le score de sentiment de cette réunion est inférieur au seuil configuré.</p>
    <div style="background: #FEF2F2; border-radius: 10px; padding: 20px; margin: 16px 0; border: 1px solid #FECACA;">
      <p style="font-size: 36px; font-weight: 800; color: #EF4444; margin: 0; text-align: center;">{{sentiment_score}}%</p>
      <p style="text-align: center; color: #991B1B; font-size: 13px; margin: 8px 0 0;">Score sentiment négatif</p>
    </div>
    <div class="block">
      <p class="block-title">🔍 Points de tension détectés</p>
      <p class="task-item">→ {{tension_1}}</p>
      <p class="task-item">→ {{tension_2}}</p>
    </div>
    <div style="text-align: center; padding: 24px 0;">
      <a href="#" class="btn-cta">Voir le rapport détaillé →</a>
    </div>
  </div>
  <div class="footer">
    <p>Alerte automatique RapidoMeet · Seuil configuré : {{threshold}}%</p>
  </div>
</div>`,
    css: baseStyles,
  },
  {
    id: "vide",
    name: "Template vide",
    description: "Commencer avec un template vierge",
    emoji: "✨",
    html: `<div class="email-wrapper">
  <div class="header">
    <h1>Votre titre ici</h1>
  </div>
  <div class="content">
    <h2>Titre de section</h2>
    <p>Votre contenu ici. Glissez-déposez des blocs depuis le panneau de gauche pour construire votre email.</p>
    <div style="text-align: center; padding: 24px 0;">
      <a href="#" class="btn-cta">Bouton d'action →</a>
    </div>
  </div>
  <div class="footer">
    <p>© {{year}} {{company_name}}</p>
  </div>
</div>`,
    css: baseStyles,
  },
];
