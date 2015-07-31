# Percolate API Reference 5.0.0

## /charge

### DELETE

n/a

### GET

To charge a credit card, you create a charge object. If your API key is in test mode, the supplied payment source (e.g., card or Bitcoin receiver) won&#x27;t actually be charged, though everything else will occur as if in live mode. (Stripe assumes that the charge would have completed successfully).

| Name | Type | Description
|-|-|-
| otp_secret_setup_token * | string  | A positive integer in the smallest currency unit (e.g 100 cents to charge $1.00, or 1 to charge ¥1, a 0-decimal currency) representing how much to charge the card. The minimum amount is $0.50 (or equivalent in charge currency).

### POST

n/a

| Name | Type | Description
|-|-|-
| scope_id * | [string]  | 
| source  | string  | 
| target * | string  | 
| text * | string  | 
