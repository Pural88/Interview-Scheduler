import React, { useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "./StarRating.css";

/**
 * Star rating for display or input.
 *
 * Read-only (default) shows halves for fractional averages.
 * Pass `editable` with `onChange` to let the user pick a whole-star value.
 */
const StarRating = ({
  value = 0,
  count,
  size = 15,
  editable = false,
  onChange,
  showValue = true,
}) => {
  const [hovered, setHovered] = useState(0);
  const shown = editable && hovered ? hovered : value;

  const renderStar = (position) => {
    if (editable) {
      // Whole stars only while picking.
      return position <= shown ? <FaStar /> : <FaRegStar />;
    }

    if (shown >= position) return <FaStar />;
    if (shown >= position - 0.5) return <FaStarHalfAlt />;
    return <FaRegStar />;
  };

  return (
    <div
      className={`star-rating${editable ? " editable" : ""}`}
      style={{ fontSize: `${size}px` }}
    >
      <span className="star-rating-stars">
        {[1, 2, 3, 4, 5].map((position) =>
          editable ? (
            <button
              key={position}
              type="button"
              className="star-btn"
              onClick={() => onChange?.(position)}
              onMouseEnter={() => setHovered(position)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${position} star${position === 1 ? "" : "s"}`}
            >
              {renderStar(position)}
            </button>
          ) : (
            <span key={position}>{renderStar(position)}</span>
          ),
        )}
      </span>

      {showValue && !editable && (
        <span className="star-rating-meta">
          {value > 0 ? (
            <>
              {value.toFixed(1)}
              {typeof count === "number" && (
                <span className="star-rating-count"> ({count})</span>
              )}
            </>
          ) : (
            <span className="star-rating-count">No ratings yet</span>
          )}
        </span>
      )}
    </div>
  );
};

export default StarRating;
