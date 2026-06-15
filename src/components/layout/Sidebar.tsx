import { useLocation, Link } from "react-router-dom"
import {
  Stethoscope,
  Users,
  Video,
  FileText,
  ClipboardList,
  Pill,
  Calendar,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotificationStore } from "@/stores/notificationStore"

const navItems = [
  { label: "患者列表", icon: Users, path: "/patients", exact: true },
  { label: "问诊室", icon: Video, path: "/consultation", exact: false },
  { label: "病历", icon: FileText, path: "/records", exact: false },
  { label: "检查资料", icon: ClipboardList, path: "/examinations", exact: false },
  { label: "用药", icon: Pill, path: "/medications", exact: false },
  { label: "随访计划", icon: Calendar, path: "/followup", exact: false },
  { label: "消息", icon: Bell, path: "/messages", exact: true },
]

export function Sidebar() {
  const location = useLocation()
  const unreadCount = useNotificationStore((s) => s.unreadCount())

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200 shrink-0">
        <Stethoscope className="w-7 h-7 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">远程复诊</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact)
          return (
            <Link
              key={item.label}
              to={item.label === "问诊室" || item.label === "病历" || item.label === "检查资料" || item.label === "用药" || item.label === "随访计划"
                ? "/patients"
                : item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-transparent"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === "消息" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
            张
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">张医生</span>
            <span className="text-xs text-gray-500">基层全科</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
