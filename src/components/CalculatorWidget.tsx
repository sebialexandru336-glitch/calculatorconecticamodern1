import React, { useState } from 'react';
import { Calculator, X, ArrowRightToLine } from 'lucide-react';

interface CalculatorWidgetProps {
  onTransfer?: (value: string) => void;
}

export const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ onTransfer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [equationStr, setEquationStr] = useState('');

  const handleNumber = (num: string) => {
    if (display === 'Error') {
      setDisplay(num);
      return;
    }
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const calculateOp = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 'Error' : a / b;
      default: return b;
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    
    let currentVal = parseFloat(display);
    
    if (operator && !waitingForNewValue && previousValue !== null) {
      const result = calculateOp(previousValue, currentVal, operator);
      if (result === 'Error') {
        setDisplay('Error');
        setPreviousValue(null);
        setOperator(null);
        setEquationStr('');
        return;
      }
      currentVal = result as number;
      setDisplay(String(currentVal));
    }
    
    setPreviousValue(currentVal);
    setOperator(op);
    setWaitingForNewValue(true);
    setEquationStr(`${currentVal} ${op}`);
  };

  const handleEqual = () => {
    if (operator && previousValue !== null && !waitingForNewValue) {
      const currentVal = parseFloat(display);
      const result = calculateOp(previousValue, currentVal, operator);
      
      if (result === 'Error') {
        setDisplay('Error');
      } else {
        // Round to 4 decimal places to avoid float precision issues
        const roundedResult = Math.round((result as number) * 10000) / 10000;
        setDisplay(String(roundedResult));
      }
      
      setEquationStr(`${previousValue} ${operator} ${currentVal} =`);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
    setEquationStr('');
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'C') clear();
    else if (action === '=') handleEqual();
    else if (['+', '-', '×', '÷'].includes(action)) handleOperator(action);
    else if (action === '.') handleDecimal();
    else if (action === '±') toggleSign();
    else handleNumber(action);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-[42px] w-[42px] rounded-xl bg-muted/50 border border-border shadow-sm text-foreground/80 hover:text-foreground hover:bg-white/10 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 backdrop-blur-md"
        aria-label="Toggle Calculator"
      >
        {isOpen ? <X size={20} /> : <Calculator size={20} />}
      </button>

      {/* Calculator Container */}
      {isOpen && (
        <div className="bg-[#24263b] border border-white/10 rounded-2xl shadow-2xl p-5 w-72 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex justify-between items-center mb-4 text-white">
            <h3 className="font-semibold text-lg tracking-wide shadow-sm">Calculator</h3>
            <div className="flex items-center gap-2">
              {onTransfer && (
                <button 
                  onClick={() => {
                    if (display !== 'Error') {
                      onTransfer(display);
                      setIsOpen(false);
                    }
                  }} 
                  className="text-white hover:text-white bg-[#8b5cf6] hover:bg-[#7c3aed] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                  title="Transferă rezultatul"
                >
                  <ArrowRightToLine size={14} />
                  <span>Transferă</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg" title="Închide">
                <X size={16} />
              </button>
            </div>
          </div>
          
          <div className="bg-[#35384e] rounded-xl p-4 text-right mb-5 border border-white/5 shadow-inner">
            <div className="text-sm text-white/50 min-h-[1.25rem] font-medium tracking-wider">{equationStr}</div>
            <div className="text-4xl font-semibold truncate mt-1 text-white tracking-tight">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              'C', '±', '÷', '×',
              '7', '8', '9', '-',
              '4', '5', '6', '+',
              '1', '2', '3', '=',
              '0', '.'
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => handleAction(btn)}
                className={`p-3 text-lg font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center
                  ${btn === '=' ? 'row-span-2 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-md border border-white/10' : 
                    btn === '0' ? 'col-span-2 bg-[#35384e] text-white hover:bg-[#40435c] border border-white/5 shadow-sm' : 
                    ['+', '-', '×', '÷'].includes(btn) ? 'bg-[#35384e] text-[#a78bfa] hover:bg-[#40435c] border border-white/5 shadow-sm' : 
                    btn === 'C' ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/10 shadow-sm' :
                    btn === '±' ? 'bg-[#35384e] text-white/70 hover:bg-[#40435c] border border-white/5 shadow-sm' :
                    'bg-[#2d3047] text-white hover:bg-[#3d415f] border border-white/5 shadow-sm'
                  }`}
                style={btn === '=' ? { gridRow: 'span 2' } : {}}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
