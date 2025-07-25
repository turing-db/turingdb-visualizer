import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/__authenticated')({
  component: AppLayout,
  beforeLoad: ({ context }) => {
    const { isAuthenticated } = context.auth
    if (!isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }

    return {}
  },
})

function AppLayout() {
  return (
    <div className=" app-scrollbar box-border grid h-screen w-full grid-cols-2 grid-cols-[max-content_1fr] grid-rows-[max-content_1fr] text-white">
      <div className="row-span-2">{/* <TuringSideBar /> */}</div>
      <div>{/* <TuringTopBar /> */}</div>
      <div className="h-full w-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
