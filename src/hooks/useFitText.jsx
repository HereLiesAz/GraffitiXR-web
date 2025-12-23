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

import { useEffect, useRef } from 'react';

/**
 * A custom React hook that dynamically adjusts the font size of a text element
 * to fit within its parent container.
 *
 * This hook uses a binary search algorithm to efficiently find the optimal font size.
 * It also uses a ResizeObserver to re-calculate the font size whenever the container's
 * dimensions change.
 *
 * @returns {React.RefObject} A React ref object that should be attached to the text
 * element you want to resize.
 */
const useFitText = ({ min = 1, max = 20 } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const container = element.parentElement;
    if (!container) return;

    const resizeText = () => {
      let currentMin = min;
      let currentMax = max;
      let fontSize;

      const isOverflowing = () => element.scrollWidth > container.clientWidth || element.scrollHeight > container.clientHeight;

      // Binary search for the best font size
      while (currentMin <= currentMax) {
        fontSize = Math.floor((currentMin + currentMax) / 2);
        element.style.fontSize = `${fontSize}px`;

        if (isOverflowing()) {
          currentMax = fontSize - 1;
        } else {
          currentMin = fontSize + 1;
        }
      }
      // After the loop, max is the largest size that fits.
      element.style.fontSize = `${currentMax}px`;
    };

    resizeText();

    // Re-run the text fitting logic when the container is resized.
    const resizeObserver = new ResizeObserver(resizeText);
    resizeObserver.observe(container);

    // Cleanup the observer when the component unmounts.
    return () => resizeObserver.disconnect();
  }, [ref]);

  return ref;
};

export default useFitText;
