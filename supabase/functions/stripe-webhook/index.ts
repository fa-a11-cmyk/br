import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const signature = req.headers.get("stripe-signature");

  // If no signature, this is not from Stripe — reject
  if (!signature) {
    return new Response(JSON.stringify({ error: "No Stripe signature" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    // Without webhook secret, parse but log warning
    console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
    event = JSON.parse(body);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string);
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: sub.items.data[0]?.price?.lookup_key || "pro",
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }, { onConflict: "user_id" });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .single();

        if (existing) {
          await supabase.from("subscriptions").update({
            status: sub.status,
            plan: sub.status === "canceled" ? "free" : undefined,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq("stripe_subscription_id", sub.id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await supabase.from("subscriptions").update({
            status: "active",
          }).eq("stripe_subscription_id", invoice.subscription);

          // Trigger affiliate conversion tracking
          const customerId = invoice.customer as string;
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("user_id, plan")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (sub) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            await fetch(`${supabaseUrl}/functions/v1/affiliate-tracker`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                action: "track_conversion",
                payload: {
                  referred_user_id: sub.user_id,
                  plan: sub.plan,
                  mrr_euros: sub.plan === "pro" ? 24.90 : 9.90,
                  stripe_customer_id: customerId,
                  stripe_invoice_id: invoice.id,
                },
              }),
            }).catch(() => {});
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await supabase.from("subscriptions").update({
            status: "past_due",
          }).eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
