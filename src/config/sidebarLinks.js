// ==========================
// 📁 sidebarLinks.js
// ==========================
// This file defines all sidebar menu links used in your dashboard.
// Each link has the following structure:
//   - label: Name displayed in the sidebar
//   - to: Route path (if it's a direct link)
//   - roles: User roles that can see this link
//   - sublinks: Nested items (optional for dropdown menus)
//
// Roles supported:
//   - admin
//   - advertiser / advertiser_manager
//   - publisher / publisher_manager
// ==========================
export const sidebarLinks = [
  // ==========================
  // 🔹 ADMIN SECTION
  // ==========================
  {
    to: "home",
    label: "Dashboard",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "operations",
      "publisher",
      "publisher_manager",
      "pub_executive",
      "adv_executive",
    ],
  },
  {
    label: "Users",
    roles: ["admin", "advertiser_manager", "publisher_manager"],
    sublinks: [
      { to: "listsubadmin", label: "Existing Users", roles: ["admin"] },
      {
        to: "createsubadmin",
        label: "Create User",
        roles: ["admin", "advertiser_manager", "publisher_manager"],
      },
    ],
  },
  // { to: "review", label: "Review", roles: ["admin"] },
  { to: "advertiser-data", label: "Advertiser Data", roles: ["admin"] },
  { to: "publisher-data", label: "Publisher Data", roles: ["admin"] },

  // ==========================
  // 🔹 ADVERTISER SECTION
  // ==========================
  {
    label: "Advertiser",
    roles: ["advertiser", "advertiser_manager", "operations"],
    sublinks: [
      {
        to: "listadvform",
        label: "Existing Advertisers",
        roles: [
          "advertiser",
          "advertiser_manager",
          "adv_executive",
          "operations",
        ],
      },
      {
        to: "createadvform",
        label: "Add New Advertiser",
        roles: ["advertiser_manager"],
      },
    ],
  },

  // ==========================
  // 🔹 PUBLISHER SECTION
  // ==========================
  {
    label: "Publisher",
    roles: ["publisher", "publisher_manager", "pub_executive"],
    sublinks: [
      {
        to: "listpubform",
        label: "Existing Publishers",
        roles: ["publisher", "publisher_manager", "pub_executive"],
      },
      {
        to: "createpubform",
        label: "Add New Publisher",
        roles: ["publisher_manager"],
      },
    ],
  },

  // ==========================
  // 🔹 CAMPAIGN SECTION
  // (Used by all user types)
  // ==========================
  {
    label: "Campaigns",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "publisher",
      "publisher_manager",
      "operations",
      "publisher_external",
      "pub_executive",
      "adv_executive",
    ],
    sublinks: [
      // --- Campaign Data Submenu ---
      {
        label: "Campaign Data",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "publisher",
          "publisher_manager",
          "operations",
          "publisher_external",
          "pub_executive",
          "adv_executive",
        ],
        sublinks: [
          {
            to: "pubidtable",
            label: "PUBID",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "publisher",
              "publisher_manager",
              "operations",
              "publisher_external",
              "pub_executive",
              "adv_executive",
            ],
          },
          // Separate PID Data routes for different roles
          { to: "current-campaign", label: "PID Data", roles: ["admin"] },
          {
            to: "currentadvdata",
            label: "PID Data",
            roles: [
              "advertiser",
              "advertiser_manager",
              "adv_executive",
              "operations",
            ],
          },
          {
            to: "currentpubdata",
            label: "PID Data",
            roles: [
              "publisher",
              "publisher_manager",
              "publisher_external",
              "pub_executive",
            ],
          },
          {
            to: "campaignlist",
            label: "Campaigns",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "publisher",
              "publisher_manager",
              "operations",
              "adv_executive",
              "pub_executive",
            ],
          },
        ],
      },

      // --- Create Campaign ---
      {
        to: "createcampaign",
        label: "Create Campaign",
        roles: ["advertiser", "advertiser_manager", "adv_executive", "admin"],
      },

      // --- Add Parameters ---
      {
        label: "Add Parameter",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "adv_executive",
          "operations",
        ],
        sublinks: [
          {
            to: "pid",
            label: "PID Form",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "adv_executive",
              "operations",
            ],
          },
          {
            to: "payableevent",
            label: "Payable Events",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "adv_executive",
              "operations",
            ],
          },
          {
            to: "mmptracker",
            label: "MMP Tracker",
            roles: [
              "admin",
              "advertiser",
              "advertiser_manager",
              "adv_executive",
              "operations",
            ],
          },
        ],
      },
    ],
  },

  // ==========================
  // 🔹 ADVERTISER REQUESTS
  // ==========================
  {
    to: "view-request",
    label: "Requests",
    roles: [
      "advertiser",
      "advertiser_manager",
      "adv_executive",
      "operations",
      "admin",
    ],
  },

  // ==========================
  // 🔹 PUBLISHER REQUESTS
  // ==========================
  {
    to: "makerequest",
    label: "Request Links",
    roles: ["publisher", "pub_executive", "publisher_manager", "admin"],
  },
  { to: "totalpiddata", label: "Recent PID", roles: ["optimization"] },
  { to: "optimizationalldata", label: "PID Data", roles: ["optimization"] },
  // ==========================
  // 🔹 ANALYTICS / REPORTS
  // ==========================
  {
    label: "Analysis",
    roles: [
      "admin",
      "advertiser",
      "publisher",
      "advertiser_manager",
      "publisher_manager",
      "operations",
      "publisher_external",
      "optimization",
      "pub_executive",
      "adv_executive",
    ],
    sublinks: [
      {
        to: "reportform",
        label: "Reports",
        roles: [
          "operations",
          "advertiser_manager",
          "advertiser",
          "admin",
          "pub_executive",
          "adv_executive",
        ],
      },
      {
        to: "analytics",
        label: "Analytics",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "publisher",
          "publisher_manager",
          "operations",
          "publisher_external",
          "optimization",
          "pub_executive",
          "adv_executive",
        ],
      },
    ],
  },
  // ==========================
  // 🔹 PUBLISHER MANAGER SECTION
  // ==========================
  // Separate PID Data routes for different roles

  {
    to: "blacklistpid",
    label: "Blacklist PID",
    roles: ["publisher_manager", "admin"],
  },
  {
    to: "conversion",
    label: "Conversions",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "publisher",
      "publisher_manager",
      "operations",
    ],
  },
  {
    label: "Step To Sale",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "operations",
      "publisher",
      "publisher_manager",
    ],
    permission: "can_add_store",
    sublinks: [
      {
        to: "createdeals",
        label: "Create Deals",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listdeals",
        label: "List Deals",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "createoffer",
        label: "Create Offer",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listoffer",
        label: "List Offers",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "createcategory",
        label: "Create Category",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
      {
        to: "listcategory",
        label: "List Categories",
        roles: [
          "admin",
          "advertiser",
          "advertiser_manager",
          "operations",
          "publisher",
          "publisher_manager",
        ],
      },
    ],
  },
  {
    to: "billing",
    label: "Validation",
    roles: [
      "admin",
      "advertiser",
      "publisher",
      "adv_executive",
      "advertiser_manager",
      "publisher_manager",
      "operations",
      "pub_executive",
      "publisher_external",
    ],
  },
  {
    to: "advertiserbill",
    label: "Advertiser Billing",
    roles: [
      "admin",
      "advertiser",
      "advertiser_manager",
      "adv_executive",
      "operations",
    ],
  },
  {
    to: "publisherbill",
    label: "Publisher Billing",
    roles: [
      "admin",
      "publisher",
      "publisher_manager",
      "publisher_external",
      "pub_executive",
    ],
  },
  {
    to: "accountsadvbill",
    label: "Advertiser Account",
    roles: ["admin", "accounts"],
  },
  {
    to: "accountspubbill",
    label: "Publisher Account",
    roles: ["admin", "accounts"],
  },
  // ==========================
  // 🔹 ACCOUNT SETTINGS
  // ==========================
  {
    to: "myaccount",
    label: "My Account",
    roles: [
      "admin",
      "advertiser",
      "publisher",
      "advertiser_manager",
      "publisher_manager",
      "operations",
      "publisher_external",
      "optimization",
      "pub_executive",
      "adv_executive",
    ],
  },
];
