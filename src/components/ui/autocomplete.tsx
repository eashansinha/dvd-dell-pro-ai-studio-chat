import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export interface AutocompleteOption {
  value: string
  label: string
}

interface AutocompleteProps {
  options: string[] | AutocompleteOption[]
  value?: string
  onChange?: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  size?: "default" | "sm" | "lg"
  disabled?: boolean
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  emptyMessage = "No options found.",
  className,
  size = "default",
  disabled = false,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<string | undefined>(value)

  const formattedOptions: AutocompleteOption[] = options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option } 
      : option as AutocompleteOption
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            size === "sm" ? "h-8 text-xs" : "",
            size === "lg" ? "h-12" : "",
            className
          )}
          disabled={disabled}
        >
          {selected
            ? formattedOptions.find(option => option.value === selected)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            {formattedOptions.map(option => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  const newValue = currentValue === selected ? null : currentValue
                  setSelected(newValue || undefined)
                  onChange?.(newValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
