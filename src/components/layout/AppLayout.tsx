import { useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

const routeTitleMap: Record<string, string> = {
  "/patients": "患者列表",
  "/timeline": "患者时间线",
  "/consultation": "问诊室",
  "/records": "病历",
  "/examinations": "检查资料",
  "/medications": "用药",
  "/followup": "随访计划",
  "/messages": "消息中心",
}

function getTitle(pathname: string): string {
  if (routeTitleMap[pathname]) return routeTitleMap[pathname]
  const segments = pathname.split("/")
  for (let i = segments.length; i > 0; i--) {
    const prefix = segments.slice(0, i).join("/")
    if (routeTitleMap[prefix]) return routeTitleMap[prefix]
  }
  return "远程复诊"
}

export function AppLayout() {
  const location = useLocation()
  const title = getTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
