// configTemplates.js

export const CONFIG_TEMPLATES = {
  appsflyer: {
    label: "AppsFlyer",

    events: true,

    rule1: ["CTI", "ITE1", "ITE2"],

    rule2: [
      "RI",
      "PI",
      "Total Install Fraud",
      "PA E2",
    ],

    ignoreMetrics: [
      "C2I",
      "Install Fraud",
      "I2E2",
      "PA E2",
    ],
  },

  adjust: {
    label: "Adjust",

    events: true,

    rule1: [
      "CTI",
      "ITE1",
      "ITE2",
    ],

    rule2: [],

    ignoreMetrics: [
      "CTI",
      "ITE1",
      "ITE2",
    ],
  },

  singular: {
    label: "Singular",

    events: true,

    rule1: [
      "CTI",
      "ITE1",
      "ITE2",
    ],

    rule2: [],

    ignoreMetrics: [
      "CTI",
      "ITE1",
      "ITE2",
    ],
  },
};