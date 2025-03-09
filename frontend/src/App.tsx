import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import HomePage from "./pages/HomePage";
import { RecoilRoot } from "recoil";
import { WebSocketProvider } from "./context/WebSocketContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : <Navigate to="/signin" />;
};


function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/" element={<ProtectedRoute><RecoilRoot><HomePage /></RecoilRoot></ProtectedRoute>} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}


export default App;
