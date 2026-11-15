import { useEffect, useRef, useState } from "react";

// Provides pointer-drag handlers and a viewport-bounded position for a panel.
const useDragControls = (isExpanded) => {
  const [position, setPosition] = useState(null);
  const modalRef = useRef(null);
  const dragRef = useRef(null);

  // Begin dragging only from the handle itself, not from its interactive controls.
  const handlePointerDown = (event) => {
    if (
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest("button"))
    ) {
      return;
    }

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  // Update the panel's position while keeping it inside the viewport.
  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    setPosition({
      left: Math.min(
        maxLeft,
        Math.max(0, drag.left + event.clientX - drag.startX),
      ),
      top: Math.min(
        maxTop,
        Math.max(0, drag.top + event.clientY - drag.startY),
      ),
    });
  };

  // End the active drag when its pointer is released or cancelled.
  const handlePointerEnd = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  // Reposition an expanded panel if it was moved near the viewport edge while collapsed.
  useEffect(() => {
    if (!position || !isExpanded || !modalRef.current) {
      return;
    }

    const maxTop = Math.max(
      0,
      window.innerHeight - modalRef.current.getBoundingClientRect().height,
    );
    if (position.top > maxTop) {
      setPosition({ ...position, top: maxTop });
    }
  }, [position, isExpanded]);

  return {
    position,
    modalRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
  };
};

export default useDragControls;
