import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const renderModal = () => {
    if (!isOpen || !mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 px-2 py-6">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Modal Window */}
        <div className="bg-[#1a1b2e]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-6 w-full max-w-[340px] relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-5 text-white">
            <h3 className="font-bold text-[19px] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Calculator</h3>
            <div className="flex items-center gap-2">
              {onTransfer && (
                <button 
                  onClick={() => {
                    if (display !== 'Error') {
                      onTransfer(display);
                      setIsOpen(false);
                    }
                  }} 
                  className="text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                  title="Transferă rezultatul"
                >
                  <ArrowRightToLine size={14} />
                  <span>Transferă</span>
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl" 
                title="Închide"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="bg-[#24263b]/80 backdrop-blur-md rounded-2xl p-5 text-right mb-6 border border-white/5 shadow-inner">
            <div className="text-[13px] text-white/50 min-h-[1.25rem] font-medium tracking-wider mb-1">{equationStr}</div>
            <div className="text-[42px] font-bold truncate text-white tracking-tight leading-none">{display}</div>
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
                className={`p-3.5 text-[20px] font-semibold rounded-[18px] transition-all active:scale-95 flex items-center justify-center
                  ${btn === '=' ? 'row-span-2 bg-gradient-to-br from-violet-600 to-purple-700 text-white hover:from-violet-500 hover:to-purple-600 shadow-[0_8px_20px_rgba(139,92,246,0.3)] border border-white/10' : 
                    btn === '0' ? 'col-span-2 bg-[#2d3047]/80 text-white hover:bg-[#3d415f] border border-white/5 shadow-sm' : 
                    ['+', '-', '×', '÷'].includes(btn) ? 'bg-[#2d3047]/80 text-[#c084fc] hover:bg-[#3d415f] border border-white/5 shadow-sm' : 
                    btn === 'C' ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/10 shadow-sm' :
                    btn === '±' ? 'bg-[#2d3047]/80 text-white/70 hover:bg-[#3d415f] border border-white/5 shadow-sm' :
                    'bg-[#24263b]/80 text-white hover:bg-[#35384e] border border-white/5 shadow-sm'
                  }`}
                style={btn === '=' ? { gridRow: 'span 2' } : {}}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-[42px] w-[42px] rounded-xl bg-muted/50 border border-border shadow-sm text-foreground/80 hover:text-foreground hover:bg-white/10 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 backdrop-blur-md"
          aria-label="Toggle Calculator"
        >
          {isOpen ? <X size={20} /> : <Calculator size={20} />}
        </button>
      </div>

      {renderModal()}
    </>
  );
};

