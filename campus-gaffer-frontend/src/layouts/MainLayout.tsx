import { Outlet} from 'react-router-dom';
import Navbar from '../components/Navbar';


const MainLayout = () => {
  return (
    <div className="layout-container">
      <Navbar />
      <main>
        <Outlet>
      
      </main>

    </div>
  )
};

export default MainLayout; 
