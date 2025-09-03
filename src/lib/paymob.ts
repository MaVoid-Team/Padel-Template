import axios from 'axios'

const BASE = 'https://accept.paymob.com/api'

export async function paymobAuthToken() {
  const { data } = await axios.post(`${BASE}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY
  })
  return data.token as string
}

export async function paymobCreateOrder(token: string, amountCents: number, currency='EGP', merchantOrderId?: string) {
  const { data } = await axios.post(`${BASE}/ecommerce/orders`, {
    auth_token: token,
    amount_cents: String(amountCents),
    currency,
    merchant_order_id: merchantOrderId
  })
  return data
}

export async function paymobPaymentKey(token: string, orderId: number, amountCents: number, billingData: any, integrationId: string) {
  const { data } = await axios.post(`${BASE}/acceptance/payment_keys`, {
    auth_token: token,
    amount_cents: String(amountCents),
    expiration: 3600,
    order_id: orderId,
    billing_data: billingData,
    currency: 'EGP',
    integration_id: integrationId
  })
  return data.token as string
}

export function paymobIframeUrl(paymentToken: string) {
  const iframeId = process.env.PAYMOB_IFRAME_ID
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`
}
