const SMS_URL = 'https://functions.poehali.dev/5937106b-938a-4fda-b5e6-d8da603aea8b';

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function sendInviteSms(phone: string, siteName: string, link: string) {
  return sendSms(phone, `Вас приглашают на квест-платформу «${siteName}»! Перейдите по ссылке: ${link}`);
}

export async function sendAccessRequestSms(ownerPhone: string, userName: string, pathTitle: string) {
  return sendSms(ownerPhone, `Мастер путей: участник ${userName} запросил доступ к пути «${pathTitle}». Войдите в панель управления для подтверждения.`);
}

export async function sendVerifyCodeSms(phone: string, code: string) {
  return sendSms(phone, `Мастер путей: ваш код подтверждения — ${code}. Не сообщайте его никому.`);
}
