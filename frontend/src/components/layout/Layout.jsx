import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 ml-64">
        <Navbar />
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-eggshell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
