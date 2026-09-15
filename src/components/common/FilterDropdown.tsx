import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Filter } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  title?: string;
  showActive?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  options,
  onChange,
  icon,
  title,
  showActive = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 180 });

  const active = options.find(o => o.value === value) || options[0];
  const isFiltered = showActive && value !== 'All';

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = Math.max(180, rect.width);
    const estimatedHeight = Math.min(280, options.length * 38 + 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const top = openUp
      ? Math.max(8, rect.top - estimatedHeight - 6)
      : Math.min(window.innerHeight - estimatedHeight - 8, rect.bottom + 6);

    setCoords({
      top,
      left: Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.left)),
      width: menuWidth
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, options.length]);

  return (
    <div className="filter-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className={`filter-dropdown-trigger${isFiltered ? ' is-active' : ''}${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen(open => !open)}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon || <Filter size={13} />}
        <span>{active?.label}</span>
        <ChevronDown size={13} className="filter-dropdown-caret" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="status-dropdown-popover filter-dropdown-menu"
            role="listbox"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 100000
            }}
          >
            {options.map(option => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`status-dropdown-item${selected ? ' active' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    if (option.value !== value) onChange(option.value);
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check size={13} /> : null}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
