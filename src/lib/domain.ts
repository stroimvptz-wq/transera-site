export type PrimaryRole = 'carrier' | 'forwarder' | 'shipper';
export type OrgRole = 'owner' | 'admin' | 'manager' | 'accountant' | 'viewer';
export type InvitableRole = Exclude<OrgRole, 'owner'>;

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  primaryRole: PrimaryRole;
  secondaryRoles: PrimaryRole[];
}

export interface Organization {
  id: string;
  name: string;
  inn: string;
}

export interface Membership {
  id: string;
  role: OrgRole;
  organization: Organization;
}

export interface Member {
  membershipId: string;
  userId: string;
  role: OrgRole;
  fullName: string;
  phone: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  role: InvitableRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export const PRIMARY_ROLES: PrimaryRole[] = ['carrier', 'forwarder', 'shipper'];

export const PRIMARY_ROLE_LABELS: Record<PrimaryRole, string> = {
  carrier: 'Перевозчик',
  forwarder: 'Экспедитор / логист',
  shipper: 'Грузовладелец',
};

export const PRIMARY_ROLE_DESCRIPTIONS: Record<PrimaryRole, string> = {
  carrier: 'Свой или арендованный транспорт, рейсы, водители',
  forwarder: 'Организация перевозок через перевозчиков',
  shipper: 'Заказ доставки грузов и контроль бюджета',
};

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Менеджер',
  accountant: 'Бухгалтер',
  viewer: 'Наблюдатель',
};

export const INVITABLE_ROLES: InvitableRole[] = ['admin', 'manager', 'accountant', 'viewer'];

export const ORG_ROLE_HINTS: Record<InvitableRole, string> = {
  admin: 'Полный доступ к данным и сотрудникам организации',
  manager: 'Работа с рейсами, клиентами и расчётами',
  accountant: 'Финансы, документы и отчёты',
  viewer: 'Только просмотр данных',
};

export function canManageOrganization(role: OrgRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function formatRub(value: number): string {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} ₽`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const RPC_ERROR_MESSAGES: Record<string, string> = {
  INVITE_NOT_FOUND: 'Приглашение с таким кодом не найдено. Проверьте код и попробуйте снова.',
  INVITE_USED: 'Этот код приглашения уже использован.',
  INVITE_EXPIRED: 'Срок действия приглашения истёк. Попросите новое приглашение.',
  ALREADY_MEMBER: 'Вы уже состоите в этой организации.',
  INVALID_NAME: 'Название организации должно содержать от 2 до 120 символов.',
  INVALID_INN: 'ИНН должен содержать 10 или 12 цифр.',
  NOT_AUTHENTICATED: 'Сессия истекла. Войдите в аккаунт заново.',
};

const AUTH_ERROR_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Неверная почта или пароль.'],
  [/user already registered|already been registered/i, 'Пользователь с такой почтой уже зарегистрирован.'],
  [/password should be at least/i, 'Пароль должен содержать не менее 8 символов.'],
  [/email not confirmed/i, 'Почта ещё не подтверждена. Обратитесь в поддержку.'],
  [/rate limit|too many requests|for security purposes/i, 'Слишком много попыток. Подождите немного и попробуйте снова.'],
  [/invalid email/i, 'Введите корректный адрес электронной почты.'],
  [/same as the old password|should be different/i, 'Новый пароль должен отличаться от старого.'],
  [/failed to fetch|network/i, 'Нет соединения с сервером. Проверьте интернет.'],
];

export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.'): string {
  if (typeof error !== 'object' || error === null || !('message' in error)) return fallback;
  const message = String((error as { message: unknown }).message ?? '').trim();

  const rpcMessage = RPC_ERROR_MESSAGES[message];
  if (rpcMessage) return rpcMessage;

  const authMatch = AUTH_ERROR_MESSAGES.find(([pattern]) => pattern.test(message));
  if (authMatch) return authMatch[1];

  return fallback;
}
