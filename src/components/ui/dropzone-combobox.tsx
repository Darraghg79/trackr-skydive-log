"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Dropzone {
  id: string
  name: string
  city?: string
  country?: string
}

interface DropzoneComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DropzoneCombobox({
  value,
  onValueChange,
  placeholder = "Select dropzone...",
  className,
}: DropzoneComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dropzones, setDropzones] = React.useState<Dropzone[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedDropzone, setSelectedDropzone] = React.useState<Dropzone | null>(null)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch dropzones based on search
  React.useEffect(() => {
    const fetchDropzones = async () => {
      try {
        setLoading(true)
        const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''
        const limit = debouncedSearch ? 50 : 20 // Show more results when searching
        const res = await fetch(
          `/api/dropzones?limit=${limit}&offset=0&isActive=true${searchParam}&t=${Date.now()}`,
          { cache: 'no-store' }
        )

        if (!res.ok) throw new Error('Failed to fetch dropzones')

        const data = await res.json()
        setDropzones(data.data || [])
      } catch (error) {
        console.error('Failed to fetch dropzones:', error)
        setDropzones([])
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchDropzones()
    }
  }, [debouncedSearch, open])

  // Load selected dropzone details when value changes
  React.useEffect(() => {
    const loadSelectedDropzone = async () => {
      if (!value) {
        setSelectedDropzone(null)
        return
      }

      // Check if already in the list
      const existing = dropzones.find(dz => dz.id === value)
      if (existing) {
        setSelectedDropzone(existing)
        return
      }

      // Fetch the specific dropzone
      try {
        const res = await fetch(`/api/dropzones/${value}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setSelectedDropzone(data)
        }
      } catch (error) {
        console.error('Failed to fetch selected dropzone:', error)
      }
    }

    loadSelectedDropzone()
  }, [value, dropzones])

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  const getDropzoneLabel = (dz: Dropzone) => {
    return dz.name
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedDropzone ? getDropzoneLabel(selectedDropzone) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col">
          <div className="border-b p-3">
            <input
              type="text"
              placeholder="Search dropzones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dropzones.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedSearch
                ? "No dropzones found. Try a different search."
                : "Start typing to search dropzones..."}
            </div>
          ) : (
            <div className="max-h-80 overflow-auto p-1">
              {dropzones.map((dz) => (
                <button
                  key={dz.id}
                  type="button"
                  onClick={() => {
                    onValueChange(dz.id === value ? "" : dz.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer text-left"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === dz.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{getDropzoneLabel(dz)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
