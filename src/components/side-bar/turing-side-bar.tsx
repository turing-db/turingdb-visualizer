import logo from '@assets/imgs/logo.svg'
import { TuringSideBarItem } from './turing-side-bar-item'

export const TuringSideBar = () => {
  return (
    <div className="border-grey-900 bg-grey-800 flex h-full w-[64px] flex-col items-center space-y-1 border">
      <img aria-label="turing-logo" src={logo} className="m-3 h-[36px] w-[36px]" />
      <TuringSideBarItem iconName="graph" page="viewer" name="Viewer" />
      <TuringSideBarItem iconName="database" page="databases" name="Databases" />
    </div>
  )
}
