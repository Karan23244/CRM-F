# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


frontend
├── index.html
├── node_modules
├── package-lock.json
├── package.json
├── public
│   ├── crm.png
│   ├── crm1.png
│   ├── crm2.svg
│   ├── favicon1.png
│   └── sw.js
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── Data
│   │   └── geoData.json
│   ├── components
│   │   ├── Admin
│   │   │   ├── AdvnameData.jsx
│   │   │   ├── CampianData.jsx
│   │   │   ├── PubnameData.jsx
│   │   │   ├── ReviewForm.jsx
│   │   │   └── SubAdminForm.jsx
│   │   ├── Advertiser
│   │   │   ├── AdvFormComponent.jsx
│   │   │   ├── AdvertiserAssignData.jsx
│   │   │   ├── AdvertiserCurrentData.jsx
│   │   │   ├── Graph.jsx
│   │   │   ├── MMPTrackerForm.jsx
│   │   │   ├── ManagerAllData.jsx
│   │   │   ├── NewRequest.jsx
│   │   │   ├── PIDForm.jsx
│   │   │   ├── PayableEventForm.jsx
│   │   │   ├── ReportForm.jsx
│   │   │   └── SubAdminAdvnameData.jsx
│   │   ├── Campaign_Analytics
│   │   │   ├── CampainDashboard.jsx
│   │   │   ├── PerformanceComparison.jsx
│   │   │   ├── PidAlert.jsx
│   │   │   ├── PidStable.jsx
│   │   │   ├── UploadForm.jsx
│   │   │   ├── Zone.jsx
│   │   │   └── zoneUtils.js
│   │   ├── ChangePassword.jsx
│   │   ├── Comparison.jsx
│   │   ├── InputField.jsx
│   │   ├── Invoice.jsx
│   │   ├── Login.jsx
│   │   ├── ProtectedRoutes.jsx
│   │   ├── Publisher
│   │   │   ├── BlacklistManager.jsx
│   │   │   ├── MakeRequest.jsx
│   │   │   ├── PublisherCurrentData.jsx
│   │   │   ├── PublisherFormComponent.jsx
│   │   │   ├── Socket.jsx
│   │   │   └── SubAdminPubnameData.jsx
│   │   ├── Validation.jsx
│   │   ├── exportExcel.jsx
│   │   ├── style.css
│   │   └── unused
│   │       ├── AdvertiserData.jsx
│   │       ├── CampianAllData.jsx
│   │       └── PublisherData.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── pages
│   │   ├── AdminHomepage.jsx
│   │   ├── AdvHomepage.jsx
│   │   ├── AdvertiserManagerHomepage.jsx
│   │   ├── ManagerHomepage.jsx
│   │   ├── PublisherHomepage.jsx
│   │   └── PublisherManagerHomepage.jsx
│   └── redux
│       ├── authSlice.jsx
│       └── store.jsx
└── vite.config.js