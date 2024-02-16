import Stripe from "stripe";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Client } from "pg";
import cors from "cors";

dotenv.config();

const client = new Client({
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

if (!process.env.STRIPE_SECRET || !process.env.STRIPE_ENDPOINT) {
  throw Error("you have to fill in .env file");
}

const stripe = new Stripe(process.env.STRIPE_SECRET);

const endpointSecret = process.env.STRIPE_ENDPOINT;

const port = 8080;

const app = express();
app.use(cors());
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const payload = req.body;

    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig!, endpointSecret);
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntentSucceeded = event.data.object;
          console.log(paymentIntentSucceeded.metadata);
          await client.query(
            `UPDATE transactions SET status = 'completed',stripe_id = '${paymentIntentSucceeded.id}' WHERE id = ${paymentIntentSucceeded.metadata.transaction_id}`
          );

          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.status(200).end();
    } catch (err: any) {
      console.log(err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/products", async (req, res) => {
  let queryResult = await client.query("SELECT * from products");

  res.json({ data: queryResult.rows });
});

app.post("/create-checkout-session", async (req, res) => {
  // here we always assume we are user id 1

  console.log("check req.body", req.body);
  let createTransactionResult = await client.query(
    "INSERT INTO transactions (user_id,status) VALUES ($1,$2) returning id",
    [1, "in progress"]
  );

  let transaction_id = createTransactionResult.rows[0].id;

  console.log("check transaction_id", transaction_id);
  let line_items = [];

  for (let entry of req.body) {
    let queryProductResult = await client.query(
      "SELECT name,price from products WHERE id = $1",
      [entry.product_id]
    );

    await client.query(
      "INSERT INTO transaction_details (transaction_id,product_id,unit_price,quantity) VALUES ($1,$2,$3,$4)",
      [
        transaction_id,
        entry.product_id,
        queryProductResult.rows[0].price,
        entry.quantity,
      ]
    );

    let item = {
      price_data: {
        currency: "hkd",
        product_data: {
          name: queryProductResult.rows[0].name,
        },
        unit_amount: queryProductResult.rows[0].price * 100,
      },
      quantity: entry.quantity,
    };

    line_items.push(item);
  }

  console.log("check line items", line_items);

  const metadata = {
    transaction_id: transaction_id,
  };

  const session = await stripe.checkout.sessions.create({
    line_items: line_items,
    mode: "payment",
    success_url: `http://localhost:${port}/success.html`,
    cancel_url: `http://localhost:${port}/cancel.html`,
    payment_intent_data: {
      metadata: metadata,
    },
  });

  if (session.url) res.json({ url: session.url });
  else res.json({ url: "cancel.html" });
});

app.get("/history", async (req, res) => {
  let userId = 1;
  let queryHistoryResult = await client.query(`SELECT 
  t.id AS transaction_id,
  JSON_AGG(
      JSON_BUILD_OBJECT(
          'product_id', td.product_id,
          'unit_price', td.unit_price,
          'quantity', td.quantity
      )
  ) AS transaction_details
FROM 
  transactions t
INNER JOIN 
  transaction_details td ON t.id = td.transaction_id
INNER JOIN
  users u ON t.user_id = u.id
WHERE
  u.id = ${userId}
GROUP BY 
  t.id;`);

  console.log(queryHistoryResult.rows);

  res.json(queryHistoryResult.rows);
});

app.listen(port, async () => {
  await client.connect();
  console.log(`App running at http://localhost:${port}/checkout.html`);
});
