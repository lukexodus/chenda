/**
 * Delivery Notification Service
 * Provider-ready hooks for external channels (email/SMS/push).
 * In-app notifications remain the source of truth; this service is best-effort.
 */

const { query } = require('../config/database');

const ENABLE_EXTERNAL_DELIVERY_NOTIFICATIONS = (process.env.ENABLE_EXTERNAL_DELIVERY_NOTIFICATIONS || 'false') === 'true';
const ENABLE_DELIVERY_EMAIL = (process.env.ENABLE_DELIVERY_EMAIL || 'false') === 'true';
const ENABLE_DELIVERY_SMS = (process.env.ENABLE_DELIVERY_SMS || 'false') === 'true';
const ENABLE_DELIVERY_PUSH = (process.env.ENABLE_DELIVERY_PUSH || 'false') === 'true';

const DELIVERY_EMAIL_PROVIDER = process.env.DELIVERY_EMAIL_PROVIDER || 'provider_not_configured';
const DELIVERY_SMS_PROVIDER = process.env.DELIVERY_SMS_PROVIDER || 'provider_not_configured';
const DELIVERY_PUSH_PROVIDER = process.env.DELIVERY_PUSH_PROVIDER || 'provider_not_configured';

class DeliveryNotificationService {
  async sendDeliveryEventNotifications({ userIds = [], eventType, title, message, metadata = {} }) {
    if (!ENABLE_EXTERNAL_DELIVERY_NOTIFICATIONS) {
      return { skipped: true, reason: 'external_delivery_notifications_disabled' };
    }

    const uniqueUserIds = [...new Set((userIds || []).filter((id) => Number.isFinite(Number(id))))];
    if (uniqueUserIds.length === 0) {
      return { skipped: true, reason: 'no_recipients' };
    }

    try {
      const recipients = await this._getRecipients(uniqueUserIds);
      const summary = {
        eventType,
        recipientCount: recipients.length,
        channels: {
          email: 0,
          sms: 0,
          push: 0,
        },
      };

      await Promise.all(
        recipients.map(async (recipient) => {
          if (ENABLE_DELIVERY_EMAIL && recipient.email) {
            await this._sendEmail({ recipient, title, message, eventType, metadata });
            summary.channels.email += 1;
          }

          if (ENABLE_DELIVERY_SMS) {
            // Phone field is not modeled yet; placeholder for future provider integration.
            await this._sendSms({ recipient, title, message, eventType, metadata });
            summary.channels.sms += 1;
          }

          if (ENABLE_DELIVERY_PUSH) {
            // Device token storage is not modeled yet; placeholder for future provider integration.
            await this._sendPush({ recipient, title, message, eventType, metadata });
            summary.channels.push += 1;
          }
        })
      );

      return { skipped: false, summary };
    } catch (error) {
      console.warn('DeliveryNotificationService.sendDeliveryEventNotifications failed:', error.message);
      return { skipped: true, reason: 'external_notification_error', error: error.message };
    }
  }

  async _getRecipients(userIds) {
    const result = await query(
      `SELECT id, name, email, type
       FROM users
       WHERE id = ANY($1::int[])`,
      [userIds]
    );

    return result.rows;
  }

  async _sendEmail({ recipient, title, message, eventType, metadata }) {
    console.info('[DeliveryNotificationService] EMAIL hook', {
      provider: DELIVERY_EMAIL_PROVIDER,
      to: recipient.email,
      userId: recipient.id,
      eventType,
      title,
      message,
      metadata,
    });
  }

  async _sendSms({ recipient, title, message, eventType, metadata }) {
    console.info('[DeliveryNotificationService] SMS hook', {
      provider: DELIVERY_SMS_PROVIDER,
      userId: recipient.id,
      eventType,
      title,
      message,
      metadata,
    });
  }

  async _sendPush({ recipient, title, message, eventType, metadata }) {
    console.info('[DeliveryNotificationService] PUSH hook', {
      provider: DELIVERY_PUSH_PROVIDER,
      userId: recipient.id,
      eventType,
      title,
      message,
      metadata,
    });
  }
}

module.exports = new DeliveryNotificationService();
