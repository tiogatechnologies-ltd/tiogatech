/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  note?: string
}

const Email = ({ note }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Tioga Technologies email delivery test</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Delivery test successful</Heading>
          <Text style={text}>
            This message confirms that email sending from
            notify.tiogatechnologies.com is working.
          </Text>
          {note ? <Text style={text}>{note}</Text> : null}
          <Text style={footer}>Tioga Technologies</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Tioga Technologies — email delivery test',
  displayName: 'Delivery test',
  previewData: { note: 'Sent from the admin email status panel.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }
const h1 = { color: '#0A192F', fontSize: '20px', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 12px' }
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '20px' }
