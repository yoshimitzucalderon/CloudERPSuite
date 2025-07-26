import React, { useState, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResizableTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResizableTableHeaderProps {
  children: React.ReactNode;
  onResize?: (index: number, width: number) => void;
  columnWidths?: number[];
}

interface ResizableTableHeadProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  width?: number;
  onResize?: (width: number) => void;
}

export function ResizableTable({ children, className }: ResizableTableProps) {
  return (
    <div className="relative overflow-auto">
      <Table className={className}>
        {children}
      </Table>
    </div>
  );
}

export function ResizableTableHeader({ children, onResize, columnWidths }: ResizableTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<ResizableTableHeadProps>, {
              index,
              width: columnWidths?.[index],
              onResize: (width: number) => onResize?.(index, width),
            });
          }
          return child;
        })}
      </TableRow>
    </TableHeader>
  );
}

export function ResizableTableHead({ 
  children, 
  className = "", 
  index, 
  width, 
  onResize 
}: ResizableTableHeadProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const headerRef = useRef<HTMLTableCellElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(headerRef.current?.offsetWidth || 0);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = 80; // Ancho mínimo
      const maxWidth = 400; // Ancho máximo
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      if (headerRef.current) {
        headerRef.current.style.width = `${clampedWidth}px`;
        headerRef.current.style.minWidth = `${clampedWidth}px`;
        headerRef.current.style.maxWidth = `${clampedWidth}px`;
      }
      
      onResize?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startX, startWidth, onResize]);

  const style = width ? {
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`
  } : {};

  return (
    <TableHead 
      ref={headerRef}
      className={`relative ${className} select-none`}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">{children}</span>
        <div
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-all duration-150 ${
            isResizing 
              ? 'bg-blue-600 w-2 opacity-100' 
              : 'bg-gray-300 hover:bg-blue-500 hover:w-2 opacity-0 hover:opacity-100'
          }`}
          onMouseDown={handleMouseDown}
          title="Arrastrar para redimensionar columna"
        />
      </div>
    </TableHead>
  );
}

export { TableBody, TableCell, TableRow };