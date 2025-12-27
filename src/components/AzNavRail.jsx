import React, { useState, useEffect, useRef } from 'react';
import './AzNavRail.css';
import AzNavRailButton from './AzNavRailButton';
import AzRailHostItem from './AzRailHostItem';
import AzRailSubItem from './AzRailSubItem';
import appIcon from '../assets/logo.png';

/**
 * An M3-style navigation rail that expands into a menu drawer for web applications.
 * Supports hierarchical menus via AzRailHostItem and AzRailSubItem.
 */
const AzNavRail = ({
  initiallyExpanded = false,
  content,
  settings = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const {
    displayAppNameInHeader = false,
    expandedRailWidth = '260px',
    collapsedRailWidth = '80px',
    showFooter = true,
    isLoading = false,
    appName = 'App'
  } = settings;

  const onToggle = () => setIsExpanded(!isExpanded);

  const [cyclerStates, setCyclerStates] = useState({});
  const cyclerTimers = useRef({});

  const navItems = content || [];

  const getAllItems = (items, all = []) => {
    items.forEach(item => {
      all.push(item);
      if (item.children) {
        getAllItems(item.children, all);
      }
    });
    return all;
  };

  useEffect(() => {
    const initialCyclerStates = {};
    const allItems = getAllItems(navItems);

    allItems.forEach(item => {
      if (item.isCycler) {
        initialCyclerStates[item.id] = {
          displayedOption: item.selectedOption || ''
        };
      }
    });
    setCyclerStates(initialCyclerStates);

    return () => {
      Object.values(cyclerTimers.current).forEach(clearTimeout);
    };
  }, [navItems]);

  const handleCyclerClick = (item) => {
    if (cyclerTimers.current[item.id]) {
      clearTimeout(cyclerTimers.current[item.id]);
    }

    const { options } = item;
    const currentOption = cyclerStates[item.id]?.displayedOption || item.selectedOption;
    const currentIndex = options.indexOf(currentOption);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextOption = options[nextIndex];

    setCyclerStates(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], displayedOption: nextOption }
    }));

    cyclerTimers.current[item.id] = setTimeout(() => {
      item.onClick(nextOption);
      if (isExpanded) onToggle(); // Close drawer on selection if open
      delete cyclerTimers.current[item.id];
    }, 1000);
  };

  // Helper to render items recursively or handled specifically
  const renderItem = (item, isRail = false) => {
    if (item.isDivider) {
      return <div key={item.id} className="menu-divider" />;
    }

    // Host Item Handling
    if (item.type === 'host') {
      if (isRail) {
        // In rail (collapsed), we might show nothing for the host itself,
        // or we iterate children to find "rail items".
        // The original logic filtered by `isRailItem`.
        // If a Host contains rail items, they should be shown.
        if (item.children) {
          return item.children.filter(child => child.isRailItem).map(child => renderItem(child, true));
        }
        return null;
      } else {
        // In expanded menu, show Host Item as container/header + children
        return (
          <AzRailHostItem key={item.id} item={item}>
            {item.children && item.children.map(child => renderItem(child, false))}
          </AzRailHostItem>
        );
      }
    }

    // Sub Item / Regular Item Handling
    const finalItem = item.isCycler
      ? { ...item, selectedOption: cyclerStates[item.id]?.displayedOption }
      : item;

    if (isRail) {
       // Only render if explicitly a rail item (already filtered in caller, but safety check)
       if (!item.isRailItem) return null;
       return (
         <AzNavRailButton
           key={item.id}
           item={finalItem}
           onCyclerClick={() => handleCyclerClick(item)}
         />
       );
    } else {
       // Expanded view (Sub Item)
       return (
         <AzRailSubItem
            key={item.id}
            item={finalItem}
            onClick={() => {
                if (item.isCycler) handleCyclerClick(item);
                else {
                    item.onClick && item.onClick();
                    onToggle();
                }
            }}
         />
       );
    }
  };

  return (
    <div
      className={`az-nav-rail ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ width: isExpanded ? expandedRailWidth : collapsedRailWidth }}
    >
      <div
        className="header"
        onClick={onToggle}
        role="button"
        tabIndex="0"
        aria-label="Toggle navigation"
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {displayAppNameInHeader ? (
          <span>{appName}</span>
        ) : (
          <img src={appIcon} alt="App Icon" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        )}
      </div>

      {isLoading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="content">
          {isExpanded ? (
            <div className="menu">
              {navItems.map(item => renderItem(item, false))}
            </div>
          ) : (
            <div className="rail">
              {navItems.map(item => renderItem(item, true))}
            </div>
          )}
        </div>
      )}

      {showFooter && isExpanded && (
        <div className="footer">
        </div>
      )}
    </div>
  );
};

export default React.memo(AzNavRail);
