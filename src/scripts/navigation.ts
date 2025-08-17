// Dynamic navigation system with expandable nav rows and real-time content movement
export class DynamicNavigation {
  private contentScroll: HTMLElement | null;
  private navRow1: HTMLElement | null;
  private navToggle: HTMLElement | null;
  private dynamicNavContainer: HTMLElement | null;
  //private dynamicRestNavContainer: HTMLElement | null;
  private titleRow1: HTMLElement | null;
  private titleRow2: HTMLElement | null;
  private displayedRowRegistry: HTMLElement[] = [];
  private transitionPace: number; // Float, the pace of the animation in ms per row.

  // Configuration
  private readonly MAX_NAV_ROWS: number = 5; // K value - maximum number of nav rows (including nav-row-1)
  private readonly ANIMATION_DURATION: number = 500; // Animation duration in milliseconds

  // State variables
  private lastScrollTop: number = 0;
  private isNavExpanded: boolean = false;
  private navRows: HTMLElement[] = [];
  private titleRows: HTMLElement[] = [];
  private regionWhichTheTextIsAt: number = 1;
  
  // Range from 0 to MAX_NAV_ROWS + 2 (title rows) 
  // 1 is for h(top(text)) < h(bottom(nav bar)), increment from top to bottom range from 0 to
  // 2 is for h(bottom(nav bar)) < h(top(text)) < h(bottom(displayed_bar_1))
  // displayed_bar_1 is the first bar that is displayed, if the nav bars are folded, it is title row 1
  // if the nav bars are expanded, it is nav row 1, by extension

  constructor() {
    // DOM elements

    // nav has 2 rows, the nav row 1 is the top row, the nav row 2 can be expanded
    // title has 2 rows. title is beneath the nav row 2.
    // some rest rows can be added between the nav row 2 and the title row 1. This is not implemented yet.
    this.contentScroll = document.getElementById('content-scroll');
    this.navRow1 = document.getElementById('nav-row-1');
    this.navToggle = document.getElementById('nav-toggle');
    this.dynamicNavContainer = document.getElementById('dynamic-nav-container');
    this.titleRow1 = document.getElementById('title-row-1');
    this.titleRow2 = document.getElementById('title-row-2');
    // the pace should be 100ms to move the height of the navRow1
    // ms/px for performance. (1/v)
    this.transitionPace = 100.0 / this.navRow1!.offsetHeight;
    // Initialize
    this.init();
  }

  private init(): void {
    this.initializeNavRows();
    this.setupEventListeners();
    this.updateToggleButton();
    this.updateButtonPosition();
  }

  // Initialize nav rows and title rows arrays
  private initializeNavRows(): void {
    this.navRows = [];
    this.titleRows = [];
    this.displayedRowRegistry = [];

    // initialize the nav rows.
    for (let i = 1; i <= 2; i++) {
      const navRow = document.getElementById(`nav-row-${i}`);
      if (navRow) {
        this.navRows.push(navRow);
        // Set initial styles for animation
        navRow.style.position = 'relative';
        navRow.style.zIndex = '10';
        navRow.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        navRow.style.transform = 'translateY(0)';
        navRow.style.opacity = '1';
      }
    }
    this.displayedRowRegistry.push(this.navRows[0]);

    // TODO: implement rest rows.

    // Initialize title rows
    if (this.titleRow1) {
      this.titleRows.push(this.titleRow1);
      this.titleRow1.style.position = 'relative';
      this.titleRow1.style.zIndex = '10';
      this.titleRow1.style.transition = 'transform 0.3s ease-out';
      this.titleRow1.style.transform = 'translateY(0)';
      this.displayedRowRegistry.push(this.titleRow1);
    }
    
    if (this.titleRow2) {
      this.titleRows.push(this.titleRow2);
      this.titleRow2.style.position = 'relative';
      this.titleRow2.style.zIndex = '10';
      this.titleRow2.style.transition = 'transform 0.3s ease-out';
      this.titleRow2.style.transform = 'translateY(0)';
      this.displayedRowRegistry.push(this.titleRow2);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Toggle nav expansion
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => this.toggleNavExpansion());
    }

    if (this.contentScroll) {
      let ticking = false;
      this.contentScroll.addEventListener('scroll', (e) => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const target = e.target as HTMLElement;
            if (target) {
              const scrollTop = target.scrollTop;
              this.updateHeaders(scrollTop);
              this.lastScrollTop = scrollTop;
            }
            ticking = false;
          });
          ticking = true;
        }
      });
    }

    window.addEventListener('resize', () => this.updateButtonPosition());
  }

  // Toggle navigation expansion
  private toggleNavExpansion(): void {
    this.isNavExpanded = !this.isNavExpanded;
    
    if (this.isNavExpanded) {
      // Expand: show all nav rows
      this.expandNavRows();
    } else {
      // Collapse: hide all nav rows with real-time content movement
      this.collapseNavRowsWithContentMovement();
    }
    
    // Update toggle button appearance
    this.updateToggleButton();
  }

  
  // Helper function, return if the row is folded.
  // Args:
  // row: the row to be checked;
  private isRowFolded(row: HTMLElement): boolean {
    // the row R[k] is folded if y(top(R[k])) < y(bottom(R[k-1]))
    // assert y(top(R[k]))) >= y(top(R[k-1]))
    if (row === this.displayedRowRegistry[0]) {
      return false;
    }
    const rowTop = row.getBoundingClientRect().top;
    const previousRow = this.displayedRowRegistry[this.displayedRowRegistry.indexOf(row) - 1];
    const previousRowBottom = previousRow.getBoundingClientRect().bottom;

    return rowTop < previousRowBottom;
  }

  // Helper function, expand a certain row. (you should make sure the row below is expanded)
  // Args:
  // row: the row to be expanded;
  // Return the schedule time of the animation.
  private expandRow(row: HTMLElement, baseTime: number): number {
    if (!this.isRowFolded(row)) {
      return 0;
    }

    const index = this.displayedRowRegistry.indexOf(row);
    // move down all the rows below the row and itself synchronously
    // distance = h(top(row)) - h(bottom(row-1))
    const distance = row.getBoundingClientRect().top - this.displayedRowRegistry[index - 1].getBoundingClientRect().bottom;
    const scheduleTime = this.transitionPace * distance;
    for (let i = index; i < this.displayedRowRegistry.length; i++) {
      // schedule according to the baseTime
      setTimeout(() => {
        this.displayedRowRegistry[i].style.transform = `translateY(-${distance}px)`;
        this.displayedRowRegistry[i].style.transition = `transform ${scheduleTime}ms ease-out`;
      }, baseTime);
    }
    return scheduleTime;
  }

  // 
  private expandRowFromIndex(index: number): void {
    // all the rows are expanded sequentially from R[len(R)-1] to R[index] sequentially.
    let scheduleTime = 0;
    for (let i = this.displayedRowRegistry.length - 1; i >= index; i--) {
      // set delay according to the scheduleTime
      scheduleTime += this.expandRow(this.displayedRowRegistry[i], scheduleTime); 
    }
  }

  
  // Helper function, to move down some elements synchronously to insert some lines.
  // It will manipulate the displayedRowRegistry to insert some lines.
  // all the rows below the startIndex will be expanded.
  // Args:
  // startIndex: the index (in the displayedRowRegistry) of the first row to be inserted;
  // insertedRows: the rows to be inserted;
  // insertedRowContainer: the container of the inserted rows;
  private spareRoomAndDisplay(startIndex: number, insertedRows: HTMLElement[], insertedRowContainer: HTMLElement): void {
    
    
    this.insertedRows.forEach((row) => {
        // Three sync animations:
        // 1. Move down the rows from the startIndex synchronously
        // 2. update the height of the insertedRowContainer
        // 3. display the rows

        // 1. Move down the rows from the startIndex
        for (let i = startIndex; i < this.displayedRowRegistry.length; i++) {
          this.displayedRowRegistry[i].style.transform = `translateY(-${insertedRows.length * 100}px)`;
        }
        // 2. update the height of the insertedRowContainer
        insertedRowContainer.style.height = `${insertedRows.length * 100}px`;
        // 3. Move down the rows
        for (let i = startIndex; i < this.displayedRowRegistry.length; i++) {
          this.displayedRowRegistry[i].style.transform = `translateY(-${insertedRows.length * 100}px)`;
        }

    }
  }

  // Expand nav rows with staggered animation
  // When expanding nav rows, the text scroll is not affected.
  private expandNavRows(): void {
    if (!this.dynamicNavContainer) return;
    
    // Calculate total height of all nav rows
    let totalHeight = 0;
    this.navRows.forEach(row => {
      totalHeight += row.offsetHeight;
    });
    
    // Set container height to show all rows
    this.dynamicNavContainer.style.maxHeight = `${totalHeight}px`;
    
    // Animate each row appearing from the previous row
    this.navRows.forEach((row, index) => {
      setTimeout(() => {
        row.style.transform = 'translateY(0)';
        row.style.opacity = '1';
      }, index * 100); // Stagger animation by 100ms per row
    });
    
    // Move title rows and content back to original position
    setTimeout(() => {
      this.titleRows.forEach(row => {
        row.style.transform = 'translateY(0)';
      });
    }, this.navRows.length * 100 + 100);
  }

  // Collapse nav rows with real-time content movement
  private collapseNavRowsWithContentMovement(): void {
    if (!this.dynamicNavContainer) return;
    
    // Calculate heights for smooth movement
    const navRowHeights = this.navRows.map(row => row.offsetHeight);
    let totalMovedDistance = 0;
    
    // Animate each row disappearing with content following
    this.navRows.forEach((row, index) => {
      const rowHeight = navRowHeights[index];
      const delay = (this.navRows.length - 1 - index) * 100; // Reverse stagger
      
      setTimeout(() => {
        // Move the nav row up and fade out
        row.style.transform = 'translateY(-100%)';
        row.style.opacity = '0';
        
        // Calculate the total distance moved so far
        totalMovedDistance += rowHeight;
        
        // Move title rows and content up by the accumulated distance
        this.titleRows.forEach(titleRow => {
          titleRow.style.transform = `translateY(-${totalMovedDistance}px)`;
        });
        
        // Move content area up by the accumulated distance
        if (this.contentScroll) {
          this.contentScroll.style.transform = `translateY(-${totalMovedDistance}px)`;
        }
        
      }, delay);
    });
    
    // Hide container after all animations complete and reset positions
    setTimeout(() => {
      this.dynamicNavContainer!.style.maxHeight = '0';
      
      // Reset all positions after container is hidden
      setTimeout(() => {
        // Reset nav rows
        this.navRows.forEach(row => {
          row.style.transform = 'translateY(0)';
          row.style.opacity = '1';
        });
        
        // Reset title rows
        this.titleRows.forEach(row => {
          row.style.transform = 'translateY(0)';
        });
        
        // Reset content area
        if (this.contentScroll) {
          this.contentScroll.style.transform = 'translateY(0)';
        }
      }, 150); // Slightly longer delay to ensure container is fully hidden
      
    }, this.navRows.length * 100 + this.ANIMATION_DURATION);
  }

  // Update toggle button appearance
  private updateToggleButton(): void {
    if (!this.navToggle) return;
    
    const icon = this.navToggle.querySelector('svg');
    const text = this.navToggle.querySelector('span');
    
    if (icon && text) {
      if (this.isNavExpanded) {
        // Show collapse icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
        text.textContent = 'Less';
      } else {
        // Show expand icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
        text.textContent = 'More';
      }
    }
  }

  // Enhanced scroll behavior with dynamic nav support
  private updateHeaders(scrollTop: number): void {
    const scrollThreshold = 10;
    const totalScroll = scrollTop - scrollThreshold;
    
    if (totalScroll <= 0) {
      // Reset all headers to original position
      if (this.isNavExpanded) {
        this.navRows.forEach(row => {
          row.style.transform = 'translateY(0)';
          row.style.opacity = '1';
        });
      }
      return;
    }

    // Only apply scroll effects if nav is expanded
    if (this.isNavExpanded) {
      // Calculate header positions and heights
      let cumulativeHeight = 0;
      const headerInfo = this.navRows.map(row => {
        const height = row.offsetHeight;
        const info = {
          element: row,
          height: height,
          startPosition: cumulativeHeight,
          endPosition: cumulativeHeight + height,
          originalPosition: cumulativeHeight
        };
        cumulativeHeight += height;
        return info;
      });

      // Apply progressive movement with precise edge detection
      headerInfo.forEach((header, index) => {
        if (!header.element) return;
        
        let moveDistance = 0;
        
        if (totalScroll >= header.startPosition) {
          const scrollBeyondStart = totalScroll - header.startPosition;
          
          if (scrollBeyondStart >= header.height) {
            // Header should be completely moved out
            moveDistance = -header.height;
          } else {
            // Header should move proportionally with the scroll
            moveDistance = -scrollBeyondStart;
          }
          
          // Apply synchronized movement
          header.element.style.transform = `translateY(${moveDistance}px)`;
        } else {
          // Header should remain in its original position
          header.element.style.transform = 'translateY(0)';
        }
      });
    }
  }

  // Responsive button positioning
  private updateButtonPosition(): void {
    const button = document.getElementById('toggle-button');
    if (!button) return;
    
    const isWideScreen = window.innerWidth >= 768;
    
    if (isWideScreen) {
      button.style.position = 'absolute';
      button.style.top = '20px';
      button.style.right = 'calc(30% + 20px)';
    } else {
      button.style.position = 'fixed';
      button.style.top = '20px';
      button.style.right = '20px';
    }
  }

  // Public methods for external access
  public getCurrentRegion(): number {
    return this.regionWhichTheTextIsAt;
  }

  public setCurrentRegion(region: number): void {
    this.regionWhichTheTextIsAt = region;
  }

  public getNavExpandedState(): boolean {
    return this.isNavExpanded;
  }

  public getMaxNavRows(): number {
    return this.MAX_NAV_ROWS;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DynamicNavigation();
});
