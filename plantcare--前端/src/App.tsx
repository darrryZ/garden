/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Discovery } from './pages/Discovery';
import { PlantDetail } from './pages/PlantDetail';
import { MyGarden } from './pages/MyGarden';
import { OwnedPlantDetail } from './pages/OwnedPlantDetail';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { AllPlants } from './pages/AllPlants';
import { Login } from './pages/Login';
import { BottomNav } from './components/BottomNav';
import { ScrollArea } from './components/ui/scroll-area';
import { AIConsultation } from './pages/AIConsultation';
import { CitySelect } from './pages/CitySelect';
import { AuthProvider } from './contexts/AuthContext';

// 只在指定的一级页面显示底部导航
function AppContent() {
  const location = useLocation();

  // 定义需要显示底部导航的一级页面路径
  const showBottomNavPaths = ['/', '/garden', '/profile'];
  const shouldShowBottomNav = showBottomNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <main className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Discovery />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          <Route path="/garden" element={<MyGarden />} />
          <Route path="/garden/:id" element={<OwnedPlantDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/all-plants" element={<AllPlants />} />
          <Route path="/ai-consultation" element={<AIConsultation />} />
          <Route path="/city-select" element={<CitySelect />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        {shouldShowBottomNav && <BottomNav />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

