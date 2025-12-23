// Ported from MultiGestureDetector.kt

export class GestureHandler {
    constructor(element, callbacks) {
        this.element = element;
        this.callbacks = callbacks; // { onScale, onRotate, onPan }

        this.ptrID1 = null;
        this.ptrID2 = null;

        this.prevX1 = 0; this.prevY1 = 0;
        this.prevX2 = 0; this.prevY2 = 0;
        this.prevSpan = 0;
        this.prevAngle = 0;

        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);

        this.element.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.boundHandleTouchEnd);
        this.element.addEventListener('touchcancel', this.boundHandleTouchEnd);
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.boundHandleTouchStart);
        this.element.removeEventListener('touchmove', this.boundHandleTouchMove);
        this.element.removeEventListener('touchend', this.boundHandleTouchEnd);
        this.element.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    }

    handleTouchStart(event) {
        // Don't prevent default everywhere, ARButton might need clicks.
        // But for gestures we might need to.
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (this.ptrID1 === null) {
                this.ptrID1 = touch.identifier;
                this.prevX1 = touch.clientX;
                this.prevY1 = touch.clientY;
            } else if (this.ptrID2 === null) {
                this.ptrID2 = touch.identifier;
                this.prevX2 = touch.clientX;
                this.prevY2 = touch.clientY;

                this.prevSpan = this.calculateSpan(this.prevX1, this.prevY1, this.prevX2, this.prevY2);
                this.prevAngle = this.calculateAngle(this.prevX1, this.prevY1, this.prevX2, this.prevY2);
            }
        }
    }

    handleTouchMove(event) {
        if (this.ptrID1 === null && this.ptrID2 === null) return;

        if (event.cancelable) event.preventDefault();

        // Update current positions
        let currX1 = this.prevX1, currY1 = this.prevY1;
        let currX2 = this.prevX2, currY2 = this.prevY2;
        let updated1 = false, updated2 = false;

        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === this.ptrID1) {
                currX1 = touch.clientX;
                currY1 = touch.clientY;
                updated1 = true;
            } else if (touch.identifier === this.ptrID2) {
                currX2 = touch.clientX;
                currY2 = touch.clientY;
                updated2 = true;
            }
        }

        if (this.ptrID1 !== null && this.ptrID2 !== null) {
            // Two finger gesture
            const prevMidX = (this.prevX1 + this.prevX2) / 2;
            const prevMidY = (this.prevY1 + this.prevY2) / 2;
            const currMidX = (currX1 + currX2) / 2;
            const currMidY = (currY1 + currY2) / 2;

            const deltaX = currMidX - prevMidX;
            const deltaY = currMidY - prevMidY;

            if (this.callbacks.onPan) this.callbacks.onPan(deltaX, deltaY);

            const currSpan = this.calculateSpan(currX1, currY1, currX2, currY2);
            if (this.prevSpan > 0) {
                const scaleFactor = currSpan / this.prevSpan;
                if (Math.abs(1 - scaleFactor) > 0.005) {
                    if (this.callbacks.onScale) this.callbacks.onScale(scaleFactor);
                }
            }

            const currAngle = this.calculateAngle(currX1, currY1, currX2, currY2);
            let angleDelta = currAngle - this.prevAngle;
            if (angleDelta > 180) angleDelta -= 360;
            if (angleDelta < -180) angleDelta += 360;

            if (Math.abs(angleDelta) > 0.1) {
                // Convert to radians for consistency with Android code?
                // Android: Math.toRadians(angleDelta)
                if (this.callbacks.onRotate) this.callbacks.onRotate(angleDelta * (Math.PI / 180));
            }

            this.prevSpan = currSpan;
            this.prevAngle = currAngle;
        } else if (this.ptrID1 !== null) {
            // One finger pan?
            // If we want to support single finger pan when not scaling
            // The Android code seemed to only trigger onPan inside the two-pointer block?
            // "if (ptrID1 != INVALID && ptrID2 != INVALID)" -> Yes, only 2 finger pan?
            // "MultiGestureDetector" name implies multi-touch.
            // Let's stick to 2-finger for now or check Android code again.
            // Android code: onPan is inside the `if (ptrID1 != ... && ptrID2 != ...)` block.
            // So it only supports 2-finger panning.
            // Single finger might be handled by standard drag elsewhere?
            // Or `ARScreen.kt` uses `DragGestureDetector`?
            // `MultiGestureDetector.kt` only does 2-finger.
            // I'll stick to that.
        }

        if (updated1) {
            this.prevX1 = currX1;
            this.prevY1 = currY1;
        }
        if (updated2) {
            this.prevX2 = currX2;
            this.prevY2 = currY2;
        }
    }

    handleTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            if (touch.identifier === this.ptrID1) {
                this.ptrID1 = null;
            } else if (touch.identifier === this.ptrID2) {
                this.ptrID2 = null;
            }
        }
    }

    calculateSpan(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateAngle(x1, y1, x2, y2) {
        return Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI);
    }
}
