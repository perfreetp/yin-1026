export function formatGender(gender: string): string {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return gender
}

export function formatIndicatorValue(value: number, unit: string): string {
  return `${value} ${unit}`
}

export function isIndicatorAbnormal(value: number, upper: number, lower: number): boolean {
  return value > upper || value < lower
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'text-green-600',
    completed: 'text-gray-500',
    paused: 'text-yellow-600',
    waiting: 'text-yellow-600',
    pending: 'text-orange-500',
    accepted: 'text-blue-600',
    rejected: 'text-red-600',
    stopped: 'text-gray-500',
  }
  return map[status] || 'text-gray-500'
}

export function getTagColor(tagName: string): string {
  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    'bg-red-100 text-red-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ]
  return colors[Math.abs(hash) % colors.length]
}
