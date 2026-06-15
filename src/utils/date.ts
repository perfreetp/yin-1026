import { format, formatDistanceToNow, isBefore, startOfDay, differenceInYears } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(new Date(date), formatStr)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
}

export function isOverdue(date: string): boolean {
  return isBefore(startOfDay(new Date(date)), startOfDay(new Date()))
}

export function getAge(birthDate: string): number {
  return differenceInYears(new Date(), new Date(birthDate))
}
