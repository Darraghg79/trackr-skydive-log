"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Package, X, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface GearComponent {
  id: string
  name: string
  type: string
  manufacturer: string
}

export interface Rig {
  id: string
  name: string
  rigComponents: Array<{
    id: string
    gearComponentId: string
    gearComponent?: GearComponent
  }>
}

interface GearMultiselectProps {
  rigs: Rig[]
  gearComponents: GearComponent[]
  selectedComponentIds: string[]
  onSelectionChange: (componentIds: string[]) => void
  className?: string
}

const typeLabels: Record<string, string> = {
  MAIN: "Main",
  RESERVE: "Reserve",
  AAD: "AAD",
  CONTAINER: "Container",
  OTHER: "Other",
}

export function GearMultiselect({
  rigs,
  gearComponents,
  selectedComponentIds,
  onSelectionChange,
  className,
}: GearMultiselectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedRigs, setExpandedRigs] = React.useState<Set<string>>(new Set())

  // Get component IDs that are in rigs
  const componentIdsInRigs = React.useMemo(() => {
    const ids = new Set<string>()
    rigs.forEach((rig) => {
      rig.rigComponents.forEach((rc) => {
        ids.add(rc.gearComponentId)
      })
    })
    return ids
  }, [rigs])

  // Get components not in any rig
  const unassignedComponents = React.useMemo(() => {
    return gearComponents.filter((gc) => !componentIdsInRigs.has(gc.id))
  }, [gearComponents, componentIdsInRigs])

  // Get selected component details for display
  const selectedComponents = React.useMemo(() => {
    return gearComponents.filter((gc) => selectedComponentIds.includes(gc.id))
  }, [gearComponents, selectedComponentIds])

  // Toggle a rig - selects/deselects all components in the rig
  const toggleRig = (rigId: string) => {
    const rig = rigs.find((r) => r.id === rigId)
    if (!rig) return

    const rigComponentIds = rig.rigComponents.map((rc) => rc.gearComponentId)
    const allSelected = rigComponentIds.every((id) => selectedComponentIds.includes(id))

    if (allSelected) {
      // Deselect all components from this rig
      onSelectionChange(selectedComponentIds.filter((id) => !rigComponentIds.includes(id)))
    } else {
      // Select all components from this rig
      const combined = selectedComponentIds.concat(rigComponentIds)
      const newSelection = Array.from(new Set(combined))
      onSelectionChange(newSelection)
    }
  }

  // Toggle individual component
  const toggleComponent = (componentId: string) => {
    if (selectedComponentIds.includes(componentId)) {
      onSelectionChange(selectedComponentIds.filter((id) => id !== componentId))
    } else {
      onSelectionChange([...selectedComponentIds, componentId])
    }
  }

  // Check if a rig is fully selected
  const isRigFullySelected = (rigId: string) => {
    const rig = rigs.find((r) => r.id === rigId)
    if (!rig) return false

    const rigComponentIds = rig.rigComponents.map((rc) => rc.gearComponentId)
    return rigComponentIds.length > 0 && rigComponentIds.every((id) => selectedComponentIds.includes(id))
  }

  // Check if a rig is partially selected
  const isRigPartiallySelected = (rigId: string) => {
    const rig = rigs.find((r) => r.id === rigId)
    if (!rig) return false

    const rigComponentIds = rig.rigComponents.map((rc) => rc.gearComponentId)
    const selectedCount = rigComponentIds.filter((id) => selectedComponentIds.includes(id)).length
    return selectedCount > 0 && selectedCount < rigComponentIds.length
  }

  // Toggle rig expansion
  const toggleRigExpansion = (rigId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedRigs((prev) => {
      const next = new Set(prev)
      if (next.has(rigId)) {
        next.delete(rigId)
      } else {
        next.add(rigId)
      }
      return next
    })
  }

  // Remove a selected component
  const removeComponent = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleComponent(componentId)
  }

  // Filter rigs and components based on search
  const filteredRigs = React.useMemo(() => {
    if (!searchQuery.trim()) return rigs

    const query = searchQuery.toLowerCase()
    return rigs.filter((rig) => {
      // Check if rig name matches
      if (rig.name.toLowerCase().includes(query)) return true

      // Check if any component in the rig matches
      return rig.rigComponents.some((rc) => {
        const component = gearComponents.find((gc) => gc.id === rc.gearComponentId)
        return component && component.name.toLowerCase().includes(query)
      })
    })
  }, [rigs, gearComponents, searchQuery])

  const filteredUnassignedComponents = React.useMemo(() => {
    if (!searchQuery.trim()) return unassignedComponents

    const query = searchQuery.toLowerCase()
    return unassignedComponents.filter((gc) => gc.name.toLowerCase().includes(query))
  }, [unassignedComponents, searchQuery])

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10 h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedComponents.length === 0 ? (
              <span className="text-muted-foreground">Select gear...</span>
            ) : (
              selectedComponents.map((component) => (
                <Badge
                  key={component.id}
                  variant="secondary"
                  className="gap-1"
                  onClick={(e) => removeComponent(component.id, e)}
                >
                  <Package className="h-3 w-3" />
                  {component.name}
                  <X className="h-3 w-3 hover:bg-muted rounded-sm" />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search gear..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {filteredRigs.length === 0 && filteredUnassignedComponents.length === 0 ? (
            <CommandEmpty>No gear found.</CommandEmpty>
          ) : (
            <CommandGroup className="max-h-64 overflow-auto">
              {/* Rigs Section */}
              {filteredRigs.map((rig) => {
                const isExpanded = expandedRigs.has(rig.id)
                const isFullySelected = isRigFullySelected(rig.id)
                const isPartiallySelected = isRigPartiallySelected(rig.id)

                return (
                  <div key={rig.id} className="py-1">
                    {/* Rig Header */}
                    <CommandItem
                      value={rig.name}
                      onSelect={() => toggleRig(rig.id)}
                      className="font-medium"
                    >
                      <div className="flex items-center w-full">
                        <button
                          type="button"
                          onClick={(e) => toggleRigExpansion(rig.id, e)}
                          className="mr-1 hover:bg-accent rounded p-0.5"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div
                          className={cn(
                            "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                            isFullySelected && "bg-primary border-primary",
                            isPartiallySelected && "bg-primary/50 border-primary"
                          )}
                        >
                          {isFullySelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          {isPartiallySelected && <div className="h-2 w-2 bg-primary-foreground rounded-sm" />}
                        </div>
                        <Package className="h-4 w-4 mr-2" />
                        <span>{rig.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({rig.rigComponents.length} items)
                        </span>
                      </div>
                    </CommandItem>

                    {/* Rig Components (when expanded) */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {rig.rigComponents.map((rc) => {
                          const component = gearComponents.find((gc) => gc.id === rc.gearComponentId)
                          if (!component) return null

                          const isSelected = selectedComponentIds.includes(component.id)

                          return (
                            <CommandItem
                              key={rc.id}
                              value={component.name}
                              onSelect={() => toggleComponent(component.id)}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Package className="h-3 w-3 mr-2 text-muted-foreground" />
                              <span>{component.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                ({typeLabels[component.type] || component.type})
                              </span>
                            </CommandItem>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Unassigned Components */}
              {filteredUnassignedComponents.length > 0 && (
                <>
                  {filteredRigs.length > 0 && (
                    <div className="border-t my-2" />
                  )}
                  {filteredUnassignedComponents.map((component) => {
                    const isSelected = selectedComponentIds.includes(component.id)

                    return (
                      <CommandItem
                        key={component.id}
                        value={component.name}
                        onSelect={() => toggleComponent(component.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{component.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({typeLabels[component.type] || component.type})
                        </span>
                      </CommandItem>
                    )
                  })}
                </>
              )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
