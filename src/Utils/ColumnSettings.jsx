import React, { useState, useMemo } from "react";
import {
  Drawer,
  Button,
  Select,
  Checkbox,
  Input,
  Dropdown,
  Divider,
} from "antd";
import { SettingOutlined, DownOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const ColumnSettings = ({
  columnMap = {}, // { key: label }
  hiddenColumns = [],
  setHiddenColumns,
  presets = [],
  activePreset = null,
  applyPreset,
  savePreset,
  updatePreset,
  deletePreset,
}) => {
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [search, setSearch] = useState("");

  const allColumns = useMemo(() => Object.keys(columnMap), [columnMap]);

  const filteredColumns = useMemo(
    () =>
      allColumns.filter((key) =>
        columnMap[key].toLowerCase().includes(search.toLowerCase())
      ),
    [allColumns, search, columnMap]
  );

  const toggleColumn = (key, visible) => {
    if (!visible) {
      setHiddenColumns((prev) => [...new Set([...prev, key])]);
    } else {
      setHiddenColumns((prev) => prev.filter((c) => c !== key));
    }
  };

  /* ================= Dropdown Content ================= */
  const columnDropdown = (
    <div className="w-full p-3 bg-white">
      {/* Search */}
      <Input
        size="small"
        placeholder="Search column"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 !p-2"
      />

      {/* Column List */}
      <div className="max-h-[220px] overflow-y-auto space-y-1 px-1 py-2">
        {filteredColumns.length === 0 && (
          <p className="text-xs text-gray-400 text-center">No columns found</p>
        )}

        {filteredColumns.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100">
            <span className="text-sm">{columnMap[key]}</span>
            <Checkbox
              checked={!hiddenColumns.includes(key)}
              onChange={(e) => toggleColumn(key, e.target.checked)}
            />
          </div>
        ))}
      </div>

      <Divider className="my-2" />

      {/* Quick Actions */}
      <div className="flex justify-between px-2">
        <Button size="small" type="link" onClick={() => setHiddenColumns([])}>
          Show all
        </Button>
        <Button
          size="small"
          type="link"
          onClick={() => setHiddenColumns(allColumns)}>
          Hide all
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      <Button
        icon={<SettingOutlined />}
        onClick={() => setOpen(true)}
        className="!rounded-lg">
        Column Settings
      </Button>

      {/* Drawer */}
      <Drawer
        title={
          activePreset
            ? `Preset: ${activePreset.sc_name}`
            : "Column Visibility & Presets"
        }
        placement="right"
        width={420}
        onClose={() => setOpen(false)}
        open={open}>
        {/* Preset Select */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500">
            Column Preset
          </label>
          <Select
            allowClear
            placeholder="Select preset"
            className="w-full mt-1"
            value={activePreset?.id}
            onChange={(id) => {
              const preset = presets.find((p) => p.id === id);
              applyPreset(preset);
              setPresetName("");
            }}>
            {presets.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.sc_name}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Column Dropdown */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500">Columns</label>

          <Select
            trigger={["click"]}
            placement="bottomLeft"
            className="w-full mt-1"
            dropdownRender={() => columnDropdown}
            getPopupContainer={(triggerNode) => triggerNode.parentElement}>
            <Button className="w-full mt-1 flex justify-between items-center">
              <DownOutlined />
            </Button>
          </Select>
        </div>

        {/* Preset Name */}
        {!activePreset && (
          <Input
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="mb-3"
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3">
          <Button
            type="primary"
            disabled={!!activePreset || !presetName}
            onClick={() => {
              savePreset(presetName);
              setPresetName("");
            }}>
            Save
          </Button>

          <Button
            disabled={!activePreset}
            className="!bg-yellow-500 text-white"
            onClick={updatePreset}>
            Update
          </Button>

          <Button
            danger
            disabled={!activePreset}
            onClick={() =>
              Swal.fire({
                title: "Delete preset?",
                icon: "warning",
                showCancelButton: true,
              }).then((r) => r.isConfirmed && deletePreset())
            }>
            Delete
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default ColumnSettings;
