/*
 * Copyright 2024 The AzNavRail Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useRef } from 'react';
import './AzNavRail.css';
import MenuItem from './MenuItem';
import AzNavRailButton from './AzNavRailButton';

/**
 * An M3-style navigation rail that expands into a menu drawer for web applications.
 * Now supports Headers and Dividers for hierarchical menus.
 */
const AzNavRail = ({
  initiallyExpanded = false,
  disableSwipeToOpen = false,
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

  /**
   * Toggles the expanded/collapsed state of the navigation rail.
   */
  const onToggle = () => setIsExpanded(!isExpanded);

  const [cyclerStates, setCyclerStates] = useState({});
  const cyclerTimers = useRef({});

  const navItems = content || [];

  // Initialize cycler states when the component mounts or navItems change.
  useEffect(() => {
    const initialCyclerStates = {};
    navItems.forEach(item => {
      if (item.isCycler) {
        initialCyclerStates[item.id] = {
          displayedOption: item.selectedOption || ''
        };
      }
    });
    setCyclerStates(initialCyclerStates);

    // Cleanup timers on component unmount to prevent memory leaks.
    return () => {
      Object.values(cyclerTimers.current).forEach(clearTimeout);
    };
  }, [navItems]);

  /**
   * Handles the click event for cycler items.
   * On click, it cancels any pending action, advances to the next option,
   * and sets a 1-second timer to trigger the action for the new option.
   * @param {object} item - The cycler navigation item.
   */
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
      item.onClick(nextOption); // Pass the selected option to the handler
      onToggle(); // Collapse the menu after the action
      delete cyclerTimers.current[item.id];
    }, 1000);
  };

  return (
    <div
      className={`az-nav-rail ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ width: isExpanded ? expandedRailWidth : collapsedRailWidth }}
    >
      <div className="header" onClick={onToggle}>
        {displayAppNameInHeader ? (
          <span>{appName}</span>
        ) : (
          <img src="/pwa-192x192.png" alt="App Icon" style={{width: '100%', height: '100%', objectFit: 'contain'}} /> // Using PWA icon
        )}
      </div>

      {isLoading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="content">
          {isExpanded ? (
            <div className="menu">
              {navItems.map((item, index) => {
                if (item.isHeader) {
                  return <div key={item.id || index} className="menu-header">{item.text}</div>;
                }
                if (item.isDivider) {
                  return <div key={item.id || index} className="menu-divider" />;
                }

                const finalItem = item.isCycler
                  ? { ...item, selectedOption: cyclerStates[item.id]?.displayedOption }
                  : item;

                return (
                  <MenuItem
                    key={item.id}
                    item={finalItem}
                    onToggle={onToggle}
                    onCyclerClick={() => handleCyclerClick(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rail">
              {navItems
                .filter(item => item.isRailItem)
                .map(item => {
                  const finalItem = item.isCycler
                    ? { ...item, selectedOption: cyclerStates[item.id]?.displayedOption }
                    : item;
                  return <AzNavRailButton key={item.id} item={finalItem} onCyclerClick={() => handleCyclerClick(item)} />;
                })}
            </div>
          )}
        </div>
      )}

      {showFooter && isExpanded && (
        <div className="footer">
          {/* Footer content will be added here */}
        </div>
      )}
    </div>
  );
};

export default AzNavRail;
