import { createSlice } from "@reduxjs/toolkit";
import CryptoJS from "crypto-js";

const SECRET_KEY = "your_secret_key"; // Replace with a secure key

// Function to encrypt data
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Function to decrypt data
const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

// Retrieve encrypted user from localStorage
const storedUser = localStorage.getItem("subAdmin")
  ? decryptData(localStorage.getItem("subAdmin"))
  : null;

const authSlice = createSlice({
  name: "auth",
  initialState: { user: storedUser, loading: false, error: null },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("subAdmin", encryptData(action.payload));
    },
    logout: (state) => {
      localStorage.removeItem("subAdmin");
      state.user = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
