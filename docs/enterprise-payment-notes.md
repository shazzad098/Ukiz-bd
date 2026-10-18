# Enterprise payment implementation notes

This project will use a provider adapter instead of pretending that manual bKash/Nagad Send Money is an online gateway.

- SSLCOMMERZ's official v4 documentation describes three required backend stages: Create/Get Session, receive IPN, and call Order Validation API. It explicitly says merchants must validate the transaction and amount server-side, and that IPN should be used because a customer can lose the browser session. Sources: https://developer.sslcommerz.com/doc/v4/ and https://sslcommerz.com/payment-gateway/
- bKash's official developer documentation describes one-time Tokenized Checkout Without Agreement as Create Payment followed by Execute Payment, plus Query Payment for timeout/reconciliation and Search Transaction/Refund APIs. Source: https://developer.bka.sh/
- The current storefront only records a sender number and transaction ID for manual bKash/Nagad Send Money. That is not gateway verification and must remain a clearly labelled manual-payment fallback until merchant credentials are configured.

Implementation constraint: the repository cannot safely perform live gateway calls until the owner supplies a merchant account and provider credentials. Code should support sandbox/live configuration via environment variables, never hardcode credentials, and keep manual COD/manual transfer separate from verified online payment status.
