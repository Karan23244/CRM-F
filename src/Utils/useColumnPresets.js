import { useEffect, useState } from "react";
import { permissionsApi } from "../api/permissionsApi";
import { message } from "antd";

/** 🔑 backend → table column mapping */
const PRESET_KEY_MAP = {
};

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
    } catch {
      message.error("Failed to load presets");
    }
  };

  /* ================= SAVE ================= */
  const savePreset = async (presetName) => {
    if (!presetName?.trim()) {
      message.warning("Preset name required");
      return;
    }

    const payload = {
      user_id: userId,
      sc_name: presetName,
      ...allColumns.reduce((acc, col) => {
        acc[col] = hiddenColumns.includes(col) ? 1 : 0;
        return acc;
      }, {}),
    };

    await permissionsApi.createPreset(payload);
    message.success("Preset saved");
    loadPresets();
  };

  /* ================= UPDATE ================= */
  const updatePreset = async () => {
    if (!activePreset) return;

    const payload = {
      user_id: userId,
      sc_name: activePreset.sc_name,
      ...allColumns.reduce((acc, col) => {
        acc[col] = hiddenColumns.includes(col) ? 1 : 0;
        return acc;
      }, {}),
    };

    await permissionsApi.updatePreset(activePreset.id, payload);
    message.success("Preset updated");
    loadPresets();
  };

  /* ================= DELETE ================= */
  const deletePreset = async () => {
    if (!activePreset) return;

    await permissionsApi.deletePreset(activePreset.id);
    message.success("Preset deleted");
    setActivePreset(null);
    setHiddenColumns([]);
    loadPresets();
  };

  useEffect(() => {
    loadPresets();
  }, [userId]);
  console.log(presets)
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
