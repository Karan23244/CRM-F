import { createSlice } from "@reduxjs/toolkit";
import CryptoJS from "crypto-js";

const SECRET_KEY = "your_secret_key";

// Encrypt data
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Decrypt data
const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);

    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Retrieve encrypted user
const storedUser = localStorage.getItem("subAdmin")
  ? decryptData(localStorage.getItem("subAdmin"))
  : null;

// Retrieve token
const storedToken = localStorage.getItem("token") || null;

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: storedUser,
    token: storedToken, // IMPORTANT
    loading: false,
    error: null,
  },

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;

      localStorage.setItem("subAdmin", encryptData(action.payload));
    },

    setToken: (state, action) => {
      state.token = action.payload;

      localStorage.setItem("token", action.payload);
    },

    logout: (state) => {
      localStorage.removeItem("subAdmin");
      localStorage.removeItem("token");

      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setToken, logout } = authSlice.actions;

export default authSlice.reducer;
