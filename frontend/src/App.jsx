import { Routes, Route } from "react-router-dom";
import SidebarLayout from "./layouts/SidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentWorkspacePage from "./pages/DocumentWorkspacePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route element={<SidebarLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentWorkspacePage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
