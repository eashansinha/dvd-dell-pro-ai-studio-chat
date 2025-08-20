import * as React from "react"

import { cn } from "../../lib/utils"

const List = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
))
List.displayName = "List"

const ListItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement> & {
    disabled?: boolean
  }
>(({ className, disabled, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "flex items-center py-2 px-2 rounded-md hover:bg-accent cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
    {...props}
  />
))
ListItem.displayName = "ListItem"

const ListItemText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    primary?: React.ReactNode
    secondary?: React.ReactNode
  }
>(({ className, primary, secondary, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col", className)}
    {...props}
  >
    {primary && <div className="text-sm font-medium">{primary}</div>}
    {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
  </div>
))
ListItemText.displayName = "ListItemText"

export { List, ListItem, ListItemText }
