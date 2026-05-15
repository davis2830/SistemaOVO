import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Navbar from './Navbar';

/**
 * Base layout — Sidebar + Navbar + content area.
 * All authenticated pages render inside <Outlet />.
 */
export default function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
