import { Outlet} from 'react-router-dom';
import NavBar from '../components/NavBar';


const MainLayout = () => {
  return (
    <div className="layout-container">
      <NavBar />
      <main>
        <Outlet />
      </main>

    </div>
  )
};

export default MainLayout; 
