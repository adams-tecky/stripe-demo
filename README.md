# README

There are mainly two pages for you to read documentations:

1. https://stripe.com/docs/checkout/quickstart

2. https://stripe.com/docs/payments/checkout/fulfill-orders

# How to start

1. Fill in your **.env** for Database's credentials
2. Run `yarn data` to initialize database and dummy data
3. Register account at stripe and copy sceret key at dashboard to **.env**'s STRIPE_SECRET (Remember to toggle test mode)
4. Install Stripe CLI and run `stripe listen --forward-to localhost:8080/webhook` to forward events to your local server.
5. Copy webhook signing secret and paste into **.env**'s STRIPE_ENDPOINT
6. Run `yarn dev` to start server

# Exercise

1. After payment success ,the total of the transaction is not recorded. Please correct such mistakes.

# ERD(for reference)

![ERD](./ERD.png)
