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

import React from 'react';
import useFitText from '../hooks/useFitText';
import './AzNavRailButton.css';

const DEFAULT_BORDER_COLOR = 'blue';

/**
 * A circular button for the collapsed navigation rail.
 *
 * This component displays a single item in the rail, handling standard, toggle, and cycler
 * item types. It uses the `useFitText` hook to dynamically resize the text to fit within
 * the button's circular bounds.
 *
 * @param {object} props - The component props.
 * @param {object} props.item - The navigation item object to be rendered.
 * @param {string} props.item.text - The text for a standard item.
 * @param {boolean} [props.item.isToggle] - True if the item is a toggle.
 * @param {boolean} [props.item.isChecked] - The state of the toggle item.
 * @param {string} [props.item.toggleOnText] - Text for the "on" state of a toggle.
 * @param {string} [props.item.toggleOffText] - Text for the "off" state of a toggle.
 * @param {boolean} [props.item.isCycler] - True if the item is a cycler.
 * @param {string} [props.item.selectedOption] - The currently selected option for a cycler.
 * @param {function} props.item.onClick - The click handler for the item.
 * @param {string} [props.item.color] - The border color of the button.
 * @param {function} props.onCyclerClick - The specialized click handler for cycler items.
 */
const AzNavRailButton = ({ item, onCyclerClick }) => {
  const { text, isToggle, isChecked, toggleOnText, toggleOffText, isCycler, selectedOption, onClick, color } = item;
  const textRef = useFitText();

  const textToShow = (() => {
    if (isToggle) return isChecked ? toggleOnText : toggleOffText;
    if (isCycler) return selectedOption || '';
    return text;
  })();

  const handleClick = () => {
    if (isCycler) {
      onCyclerClick();
    } else {
      onClick();
    }
  };

  return (
    <button className="az-nav-rail-button" onClick={handleClick} style={{ borderColor: color || DEFAULT_BORDER_COLOR }}>
      <span className="button-text" ref={textRef}>{textToShow}</span>
    </button>
  );
};

export default AzNavRailButton;
