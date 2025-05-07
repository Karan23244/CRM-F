import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/Login";
import AdminHome from "./pages/AdminHomepage";
import AdvertiserHome from "./pages/AdvHomepage";
import PublisherHome from "./pages/PublisherHomepage";
import ProtectedRoute from "./components/ProtectedRoutes";
import ManagerHomepage from "./pages/ManagerHomepage";
import Advertisermanagerpage from "./pages/AdvertiserManagerHomepage";
import Publishermanagerpage from "./pages/PublisherManagerHomepage";
const AppRoutes = () => {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LoginForm />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin-home" element={<AdminHome />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["advertiser"]} />}>
            <Route
              path="/advertiser-home"
              element={
                <AdvertiserHome
                />
              }
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["publisher"]} />}>
            <Route
              path="/publisher-home"
              element={
                <PublisherHome
                />
              }
            />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["publisher_manager"]} />}>
            <Route
              path="/publisher-manager-home"
              element={
                <Publishermanagerpage
                />
              }
            />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["advertiser_manager"]} />}>
            <Route
              path="/advertiser-manager-home"
              element={
                <Advertisermanagerpage
                />
              }
            />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
            <Route path="/manager-home" element={<ManagerHomepage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default AppRoutes;
