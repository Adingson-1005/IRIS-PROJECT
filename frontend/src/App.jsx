import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import InstructorDashboard from './pages/InstructorDashboard'

import UploadPaper from './pages/UploadPaper'
import ProtectedRoute from './components/ProtectedRoute'
import MyUploads from './pages/MyUploads'
import BrowseRepository from './pages/BrowseRepository'
import ManagePapers from './pages/ManagePapers'
import SearchPapers from './pages/SearchPapers'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/instructor" element={
          <ProtectedRoute allowedRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/upload" element={
          <ProtectedRoute allowedRole="instructor">
            <UploadPaper />
          </ProtectedRoute>
        } />

        <Route path="/my-uploads" element={
          <ProtectedRoute allowedRole="instructor">
            <MyUploads />
          </ProtectedRoute>
        } />

        <Route path="/browse" element={
          <ProtectedRoute allowedRole="instructor">
            <BrowseRepository />
          </ProtectedRoute>
        } />

        <Route path="/manage-papers" element={
          <ProtectedRoute allowedRole="admin">
            <ManagePapers />
          </ProtectedRoute>
        } />

        <Route path="/search-papers" element={
        <ProtectedRoute allowedRole="student">
          <SearchPapers />
        </ProtectedRoute>
        } />


      </Routes>
    </BrowserRouter>
  )
}

export default App