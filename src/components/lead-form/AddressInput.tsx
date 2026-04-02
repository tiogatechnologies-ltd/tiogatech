import { useState } from "react";
import { MapPin } from "lucide-react";
import { inputClass } from "./StepUI";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
}

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const AddressInput = ({ value, onChange }: AddressInputProps) => {
  // Parse existing value
  const parts = value.split("|||");
  const [street, setStreet] = useState(parts[0] || "");
  const [city, setCity] = useState(parts[1] || "");
  const [state, setState] = useState(parts[2] || "");

  const updateParent = (s: string, c: string, st: string) => {
    const full = [s.trim(), c.trim(), st.trim()].filter(Boolean).join(", ");
    onChange(full);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={14} className="text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Address</span>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Street Address *</label>
        <input
          className={inputClass}
          placeholder="e.g. 15 Adeniyi Jones Avenue"
          value={street}
          onChange={(e) => {
            setStreet(e.target.value);
            updateParent(e.target.value, city, state);
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">City/Area *</label>
          <input
            className={inputClass}
            placeholder="e.g. Ikeja"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              updateParent(street, e.target.value, state);
            }}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">State *</label>
          <select
            className={`${inputClass} appearance-none`}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              updateParent(street, city, e.target.value);
            }}
          >
            <option value="">Select state</option>
            {nigerianStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AddressInput;
