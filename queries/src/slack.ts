const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackMessage(
  channel: string,
  text: string,
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error("SLACK_WEBHOOK_URL environment variable is not set");
  }

  const payload = { channel, text };

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Slack API error: ${response.status} ${response.statusText}`,
    );
  }
}

export async function sendOrderAlert(
  orders: OverduePendingOrder[],
): Promise<void> {
  if (orders.length === 0) return;

  const lines = orders.map(
    (o) =>
      `• Order *${o.order_number}* — ${o.customer_name} | ${o.phone ?? "no phone"} | pending for *${Math.floor(o.days_pending)} days*`,
  );

  const text =
    `:warning: *${orders.length} order(s) have been pending for more than 3 days:*\n` +
    lines.join("\n");

  await sendSlackMessage("#order-alerts", text);
}

export interface OverduePendingOrder {
  order_number: string;
  customer_name: string;
  phone: string | null;
  days_pending: number;
  total_amount: number;
}
