import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema.js";
import { getOverduePendingOrders } from "./queries/order_queries.js";
import { sendOrderAlert } from "./slack.js";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const overdueOrders = await getOverduePendingOrders(db);
  await sendOrderAlert(overdueOrders);
}

main();
