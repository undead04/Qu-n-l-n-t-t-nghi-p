import { Option } from "@/components/ui/SelectBox";

export const convertSelectBox = (opt: Option[], value: any): Option | null => {
  return opt.find((op) => op.value == value) || null;
};
