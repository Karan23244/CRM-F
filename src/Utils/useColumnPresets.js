import { useEffect, useState } from "react";
import { permissionsApi } from "../api/permissionsApi";
import Swal from "sweetalert2";

/** 🔑 backend → table column mapping */
const PRESET_KEY_MAP = {};

export const useColumnPresets = ({ userId, allColumns }) => {
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  /* ================= APPLY PRESET ================= */
  const applyPreset = (preset) => {
    if (!preset) {
      setHiddenColumns([]);
      setActivePreset(null);
      return;
    }

    const hidden = [];

    Object.entries(preset).forEach(([key, value]) => {
      if (value === 1 || value === "1") {
        const mappedKey = PRESET_KEY_MAP[key] || key;
        if (allColumns.includes(mappedKey)) {
          hidden.push(mappedKey);
        }
      }
    });

    setHiddenColumns(hidden);
    setActivePreset(preset);
  };

  /* ================= LOAD PRESETS ================= */
  const loadPresets = async () => {
    try {
      const res = await permissionsApi.getUserPresets(userId);
      setPresets(res.data?.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load presets", "error");
    }
  };

  /* ================= SAVE ================= */
  const savePreset = async (presetName) => {
    if (!presetName?.trim()) {
      Swal.fire("Warning", "Preset name required", "warning");
      return;
    }

    try {
      const payload = {
        user_id: userId,
        sc_name: presetName,
        ...allColumns.reduce((acc, col) => {
          acc[col] = hiddenColumns.includes(col) ? 1 : 0;
          return acc;
        }, {}),
      };

      await permissionsApi.createPreset(payload);

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Preset saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      loadPresets();
    } catch {
      Swal.fire("Error", "Failed to save preset", "error");
    }
  };

  /* ================= UPDATE ================= */
  const updatePreset = async () => {
    if (!activePreset) return;

    const result = await Swal.fire({
      title: "Update preset?",
      text: "Do you want to update this preset?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
    });

    if (!result.isConfirmed) return;

    try {
      const payload = {
        user_id: userId,
        sc_name: activePreset.sc_name,
        ...allColumns.reduce((acc, col) => {
          acc[col] = hiddenColumns.includes(col) ? 1 : 0;
          return acc;
        }, {}),
      };

      await permissionsApi.updatePreset(activePreset.id, payload);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Preset updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      loadPresets();
    } catch {
      Swal.fire("Error", "Failed to update preset", "error");
    }
  };

  /* ================= DELETE ================= */
  const deletePreset = async () => {
    if (!activePreset) return;

    const result = await Swal.fire({
      title: "Delete preset?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      await permissionsApi.deletePreset(activePreset.id);

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Preset deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      setActivePreset(null);
      setHiddenColumns([]);
      loadPresets();
    } catch {
      Swal.fire("Error", "Failed to delete preset", "error");
    }
  };

  useEffect(() => {
    loadPresets();
  }, [userId]);

  return {
    presets,
    hiddenColumns,
    setHiddenColumns,
    activePreset,
    applyPreset,
    savePreset,
    updatePreset,
    deletePreset,
  };
};
