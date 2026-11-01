export interface EmailMessage { recipient: string; subject: string; text: string; unsubscribeUrl: string; idempotencyKey: string }
export interface EmailProvider { id: string; send(message: EmailMessage): Promise<{ messageId: string }>; }
export function getEmailProvider(): EmailProvider | null { return null; }