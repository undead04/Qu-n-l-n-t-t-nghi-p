"use client";
import { useState } from "react";
import Select from "react-select";
import { Option } from "./SelectBox";

interface Prop {
  options: Option[];
  value?: Option | null;
}

export default function SearchableSelect({ options, value }: Prop) {
  const [selected, setSelected] = useState<Option | null>(value || null);

  return (
    <div className="w-80">
      <Select
        options={options}
        value={selected}
        onChange={(opt) => setSelected(opt)}
        placeholder="Tìm kiếm đề tài..."
        isClearable
        isSearchable
      />
    </div>
  );
}
