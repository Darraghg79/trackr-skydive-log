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
  city?: string | null
  country?: string | null
}

interface GlobalDropzone {
  id: string
  name: string
  city?: string | null
  state?: string | null
  country?: string | null
  address?: string | null
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
  const [personalDropzones, setPersonalDropzones] = React.useState<Dropzone[]>([])
  const [globalDropzones, setGlobalDropzones] = React.useState<GlobalDropzone[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedDropzone, setSelectedDropzone] = React.useState<Dropzone | null>(null)
  const [creatingPersonal, setCreatingPersonal] = React.useState(false)

  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch both personal and global dropzones when search or open state changes
  React.useEffect(() => {
    if (!open) return

    const fetchDropzones = async () => {
      setLoading(true)
      try {
        const limit = debouncedSearch ? 50 : 20
        const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''

        const [personalRes, globalRes] = await Promise.all([
          fetch(`/api/dropzones?limit=${limit}&offset=0&isActive=true${searchParam}&t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/global-dropzones?limit=${limit}${searchParam}`, { cache: 'no-store' }),
        ])

        if (personalRes.ok) {
          const data = await personalRes.json()
          setPersonalDropzones(data.data || [])
        }

        if (globalRes.ok) {
          const data = await globalRes.json()
          setGlobalDropzones(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch dropzones:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDropzones()
  }, [debouncedSearch, open])

  // Load selected dropzone name when value changes
  React.useEffect(() => {
    if (!value) {
      setSelectedDropzone(null)
      return
    }

    const existing = personalDropzones.find(dz => dz.id === value)
    if (existing) {
      setSelectedDropzone(existing)
      return
    }

    fetch(`/api/dropzones/${value}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setSelectedDropzone(data)
      })
      .catch(() => {})
  }, [value, personalDropzones])

  React.useEffect(() => {
    if (!open) setSearchQuery("")
  }, [open])

  // When user selects a GlobalDropzone, auto-create a personal copy and return its id
  const handleGlobalSelect = async (globalDz: GlobalDropzone) => {
    // Check if user already has a personal DZ with the same name
    const alreadyExists = personalDropzones.find(
      dz => dz.name.toLowerCase() === globalDz.name.toLowerCase()
    )
    if (alreadyExists) {
      onValueChange(alreadyExists.id)
      setOpen(false)
      return
    }

    setCreatingPersonal(true)
    try {
      const res = await fetch('/api/dropzones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: globalDz.name,
          city: globalDz.city ?? undefined,
          country: globalDz.country ?? undefined,
          address: globalDz.address ?? undefined,
        }),
      })

      if (res.ok) {
        const newDz: Dropzone = await res.json()
        setPersonalDropzones(prev => [...prev, newDz])
        onValueChange(newDz.id)
      }
    } catch (error) {
      console.error('Failed to create personal dropzone:', error)
    } finally {
      setCreatingPersonal(false)
      setOpen(false)
    }
  }

  const hasPersonal = personalDropzones.length > 0
  const hasGlobal = globalDropzones.length > 0
  const showGroups = hasPersonal && hasGlobal

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedDropzone ? selectedDropzone.name : placeholder}
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

          {loading || creatingPersonal ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasPersonal && !hasGlobal ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedSearch
                ? "No dropzones found. Try a different search."
                : "Start typing to search dropzones..."}
            </div>
          ) : (
            <div className="max-h-80 overflow-auto p-1">
              {/* Personal dropzones */}
              {hasPersonal && (
                <>
                  {showGroups && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      My Dropzones
                    </div>
                  )}
                  {personalDropzones.map((dz) => (
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
                      <span className="flex-1">{dz.name}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Global dropzones */}
              {hasGlobal && (
                <>
                  {showGroups && (
                    <div className="px-2 py-1.5 mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-2">
                      All Dropzones
                    </div>
                  )}
                  {globalDropzones.map((dz) => (
                    <button
                      key={`global:${dz.id}`}
                      type="button"
                      onClick={() => handleGlobalSelect(dz)}
                      className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer text-left"
                    >
                      <Check className="mr-2 h-4 w-4 shrink-0 opacity-0" />
                      <span className="flex-1">{dz.name}</span>
                      {dz.country && (
                        <span className="ml-2 text-xs text-muted-foreground">{dz.country}</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
