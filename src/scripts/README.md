# Dynamic Navigation System

This directory contains the JavaScript/TypeScript implementation of the dynamic navigation system with expandable nav rows and real-time content movement.

## Files

### `navigation.ts`
The main TypeScript class that handles all navigation functionality:

- **DynamicNavigation**: Main class that manages the entire navigation system
- **Features**:
  - Expandable navigation rows (nav-row-2 to nav-row-K)
  - Real-time content movement during collapse/expand
  - Scroll-based header movement
  - Responsive button positioning
  - State management for navigation expansion

## Key Features

### 1. Dynamic Navigation Rows
- Configurable number of navigation rows (MAX_NAV_ROWS = 5)
- Smooth expand/collapse animations with staggered timing
- Real-time content movement during transitions

### 2. Scroll Behavior
- Progressive header movement when navigation is expanded
- Edge detection for smooth transitions
- Performance optimized with requestAnimationFrame

### 3. State Management
- Tracks navigation expansion state
- Manages current text region position
- Handles responsive behavior

## Usage

### Basic Initialization
```typescript
import { DynamicNavigation } from './scripts/navigation.ts';

// The system automatically initializes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DynamicNavigation();
});
```

### Configuration
You can modify the following constants in the `DynamicNavigation` class:

```typescript
private readonly MAX_NAV_ROWS: number = 5; // Change K value
private readonly ANIMATION_DURATION: number = 500; // Animation speed
```

### Public Methods
```typescript
const nav = new DynamicNavigation();

// Get current text region
const region = nav.getCurrentRegion();

// Set text region
nav.setCurrentRegion(2);

// Check if navigation is expanded
const isExpanded = nav.getNavExpandedState();

// Get maximum navigation rows
const maxRows = nav.getMaxNavRows();
```

## Coordinate System

### Y-Axis Direction
- **Down is positive**: Y coordinates increase downward
- **Up is negative**: Y coordinates decrease upward

### Region System
The `regionWhichTheTextIsAt` variable tracks the current position:
- **0**: Text upper edge is above navigation bar
- **1, 2, 3...**: Text position from top to bottom
- Range: 0 to MAX_NAV_ROWS + 2 (including title rows)

## Animation Rules

### Expand Animation
1. Row X moves out from row X-1
2. Staggered timing (100ms delay per row)
3. Content moves back to original position

### Collapse Animation
1. Row X moves into row X-1
2. Reverse staggered timing
3. Real-time content movement with each row collapse

### Scroll Animation
1. Only active when navigation is expanded
2. Headers move with content as user scrolls
3. Progressive disappearance based on scroll position

## Performance Optimizations

1. **Throttling**: Uses requestAnimationFrame for scroll events
2. **Transform**: Uses CSS transform instead of layout changes
3. **State Management**: Efficient state tracking and updates
4. **Conditional Execution**: Scroll effects only when needed

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS transform and transition support
- requestAnimationFrame support

## Dependencies

- No external dependencies
- Pure TypeScript/JavaScript implementation
- Uses standard DOM APIs
