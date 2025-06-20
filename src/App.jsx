import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/Login";
import AdminHome from "./pages/AdminHomepage";
import AdvertiserHome from "./pages/AdvHomepage";
import PublisherHome from "./pages/PublisherHomepage";
import ProtectedRoute from "./components/ProtectedRoutes";
import Advertisermanagerpage from "./pages/AdvertiserManagerHomepage";
import Publishermanagerpage from "./pages/PublisherManagerHomepage";
import SubAdminForm from "./components/SubAdminForm";
import ReviewForm from "./components/ReviewForm";
import ChangePassword from "./components/ChangePassword";
import PubnameData from "./components/PubnameData";
import AdvnameData from "./components/AdvnameData";
import CampianData from "./components/CampianData";
import AdvFormComponent from "./components/AdvFormComponent";
import AdvertiserCurrentData from "./components/AdvertiserCurrentData";
import PIDForm from "./components/PIDForm";
import MMPTrackerForm from "./components/MMPTrackerForm";
import PayableEventForm from "./components/PayableEventForm";
import NewRequest from "./components/NewRequest";
import ExcelGraphCompare from "./components/Graph";
import ReportForm from "./components/ReportForm";
import PublisherFormComponent from "./components/PublisherFormComponent";
import PublisherCurrentData from "./components/PublisherCurrentData";
import MakeRequest from "./components/MakeRequest";
import BlacklistManager from "./components/BlacklistManager";
const AppRoutes = () => {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LoginForm />} />

          {/* Protected Routes */}

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin-home" element={<AdminHome />}>
              {/* 👇 Redirect when visiting /admin-home */}
              <Route index element={<Navigate to="subadmin" replace />} />

              <Route path="subadmin" element={<SubAdminForm />} />
              <Route path="review" element={<ReviewForm />} />
              <Route path="current-campaign" element={<CampianData />} />
              <Route path="advertiser-data" element={<AdvnameData />} />
              <Route path="publisher-data" element={<PubnameData />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["advertiser"]} />}>
            <Route path="/advertiser-home" element={<AdvertiserHome />}>
              <Route index element={<Navigate to="advform" replace />} />
              <Route path="advform" element={<AdvFormComponent />} />
              <Route
                path="currentadvdata"
                element={<AdvertiserCurrentData />}
              />
              <Route path="pid" element={<PIDForm />} />
              <Route path="payableevent" element={<PayableEventForm />} />
              <Route path="mmptracker" element={<MMPTrackerForm />} />
              <Route path="view-request" element={<NewRequest />} />
              <Route path="reportform" element={<ReportForm />} />
              <Route path="genrategraph" element={<ExcelGraphCompare />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["publisher"]} />}>
            <Route path="/publisher-home" element={<PublisherHome />}>
              <Route index element={<Navigate to="form" replace />} />
              <Route path="form" element={<PublisherFormComponent />} />
              <Route path="currentpubdata" element={<PublisherCurrentData />} />
              <Route path="makerequest" element={<MakeRequest />} />
              <Route path="changepassword" element={<ChangePassword />} />
            </Route>
          </Route>
          <Route
            element={<ProtectedRoute allowedRoles={["publisher_manager"]} />}>
            <Route
              path="/publisher-manager-home"
              element={<Publishermanagerpage />}>
              <Route index element={<Navigate to="pubform" replace />} />
              <Route path="pubform" element={<PublisherFormComponent />} />
              <Route path="currentpubdata" element={<PublisherCurrentData />} />
              <Route path="blacklistpid" element={<BlacklistManager />} />
              <Route path="makerequest" element={<MakeRequest />} />
              <Route path="changepassword" element={<ChangePassword />} />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={["advertiser_manager"]} />}>
            <Route
              path="/advertiser-manager-home"
              element={<Advertisermanagerpage />}>
              <Route index element={<Navigate to="advform" replace />} />
              <Route path="advform" element={<AdvFormComponent />} />
              <Route
                path="currentadvdata"
                element={<AdvertiserCurrentData />}
              />
              <Route path="pid" element={<PIDForm />} />
              <Route path="payableevent" element={<PayableEventForm />} />
              <Route path="mmptracker" element={<MMPTrackerForm />} />
              <Route path="view-request" element={<NewRequest />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default AppRoutes;
