import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "./label";

export function SecretField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1 relative">
      {label && <Label>{label}</Label>}
      <div className="relative w-full">
        <Input 
          type={visible ? "text" : "password"} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
