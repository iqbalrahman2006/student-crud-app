import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../App.css'; // Ensure we have access to styles

const HybridSelect = ({
    label,
    name,
    options = [],
    value,
    onChange,
    onBlur,
    placeholder = "Type or select...",
    disabled = false,
    error = null,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState("");
    // eslint-disable-next-line no-unused-vars
    const [isCustom, setIsCustom] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    // const [highlightIndex, setHighlightIndex] = useState(-1); // Unused for now

    // Safety check for options
    // const safeOptions = Array.isArray(options) ? options : []; 

    // Initialize internal state based on props
    useEffect(() => {
        // If value is not in options, treat as custom (unless empty)
        const newFilter = value || "";
        const newIsCustom = value && options.length > 0 && !options.includes(value);

        // Only update if values actually changed to prevent unnecessary re-renders
        setFilter(prev => prev !== newFilter ? newFilter : prev);
        setIsCustom(prev => prev !== newIsCustom ? newIsCustom : prev);
    }, [value, options]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onBlur) onBlur({ target: { name, value: filter } });
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filter, name, onBlur]);

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setFilter(newVal);
        setIsOpen(true);
        setIsCustom(true);
        // Propagate change immediately for typing
        onChange({ target: { name, value: newVal } });
    };

    const handleOptionClick = (option) => {
        setFilter(option);
        setIsOpen(false);
        setIsCustom(false);
        onChange({ target: { name, value: option } });
    };

    // Memoize filtered options to prevent recalculation on every render
    const filteredOptions = useMemo(() =>
        options.filter(opt =>
            opt.toLowerCase().includes(filter.toLowerCase())
        ),
        [options, filter]
    );

    return (
        <div className="form-group floating-label-group" ref={wrapperRef}>
            <div className="hybrid-select-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    id={name}
                    name={name}
                    className={`floating-input ${error ? 'has-error' : ''}`}
                    placeholder=" "
                    value={filter}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    autoComplete="off"
                />
                <label htmlFor={name} className="floating-label">
                    {label} {required && <span className="required-star">*</span>}
                </label>

                {/* Dropdown Arrow Indicator */}
                <span className="hybrid-select-arrow" onClick={() => !disabled && setIsOpen(!isOpen)}>
                    ▼
                </span>

                {/* Dropdown List */}
                {isOpen && !disabled && (
                    <ul className="hybrid-dropdown-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleOptionClick(opt)}
                                    className={opt === value ? 'selected' : ''}
                                >
                                    {opt}
                                </li>
                            ))
                        ) : (
                            <li className="no-results">
                                <em>No matches. Custom entry enabled.</em>
                            </li>
                        )}
                    </ul>
                )}
            </div>
            {error && <div className="error-text"><span>⚠️</span> {error}</div>}
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(HybridSelect, (prevProps, nextProps) => {
    // Custom comparison: only re-render if these props actually changed
    return (
        prevProps.value === nextProps.value &&
        prevProps.error === nextProps.error &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.options === nextProps.options &&
        prevProps.name === nextProps.name
    );
});
