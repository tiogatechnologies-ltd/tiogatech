/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface OrderItem {
  name?: string
  quantity?: number
  priceLabel?: string
}

interface Props {
  customerName?: string
  orderNumber?: string
  status?: string
  items?: OrderItem[]
  itemsSummary?: string
  total?: string
  deliveryLocation?: string
  phone?: string
  trackUrl?: string
}

const Email = ({
  customerName,
  orderNumber = '',
  status = 'new',
  items = [],
  itemsSummary,
  total,
  deliveryLocation,
  phone,
  trackUrl,
}: Props) => {
  const track =
    trackUrl ||
    `https://tiogatechnologies.com/track?order=${encodeURIComponent(orderNumber)}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Your Tioga order ${orderNumber} is confirmed`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Order {orderNumber} confirmed</Heading>
            <Text style={headerSub}>Status: {status}</Text>
          </Section>

          <Section style={card}>
            <Text style={greeting}>
              {customerName ? `Hi ${customerName},` : 'Hi there,'}
            </Text>
            <Text style={text}>
              Thanks for your order with Tioga Technologies. Here is a summary of
              what we received.
            </Text>

            {items.length > 0 ? (
              items.map((item, i) => (
                <Text key={i} style={itemRow}>
                  {i + 1}. {item.name}
                  {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ''}
                  {item.priceLabel ? ` — ${item.priceLabel}` : ''}
                </Text>
              ))
            ) : itemsSummary ? (
              <Text style={itemRow}>{itemsSummary}</Text>
            ) : null}

            {total ? <Text style={totalRow}>Total: {total}</Text> : null}

            <Hr style={hr} />

            {deliveryLocation ? (
              <Text style={meta}>Delivery to: {deliveryLocation}</Text>
            ) : null}
            {phone ? <Text style={meta}>Phone: {phone}</Text> : null}

            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button href={track} style={button}>
                Track your order
              </Button>
            </Section>

            <Text style={footer}>
              Tioga Technologies · Solar, Smart Home, Security
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    `Your order ${data?.orderNumber ?? ''} — Tioga Technologies`.trim(),
  displayName: 'Order confirmation',
  previewData: {
    customerName: 'Amaka',
    orderNumber: 'TT-10234',
    status: 'new',
    items: [
      { name: '5kVA Hybrid Inverter', quantity: 1, priceLabel: '₦1,250,000' },
      { name: 'Smart Door Lock', quantity: 2, priceLabel: '₦180,000' },
    ],
    total: '₦1,610,000',
    deliveryLocation: 'Jos, Plateau State',
    phone: '+234 817 800 0023',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }
const header = {
  backgroundColor: '#15803d',
  borderRadius: '12px 12px 0 0',
  padding: '24px',
}
const h1 = { color: '#ffffff', fontSize: '22px', margin: '0', fontWeight: 700 }
const headerSub = { color: '#dcfce7', fontSize: '14px', margin: '6px 0 0' }
const card = {
  border: '1px solid #e5e7eb',
  borderTop: 'none',
  borderRadius: '0 0 12px 12px',
  padding: '24px',
}
const greeting = { fontSize: '15px', color: '#0A192F', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const itemRow = { fontSize: '14px', color: '#374151', margin: '4px 0' }
const totalRow = { fontSize: '15px', color: '#0A192F', fontWeight: 700, margin: '12px 0 0' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const meta = { fontSize: '13px', color: '#6b7280', margin: '4px 0' }
const button = {
  backgroundColor: '#15803d',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
}
const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginTop: '24px',
}
