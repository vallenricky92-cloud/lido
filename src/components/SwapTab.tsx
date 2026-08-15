// src/components/SwapTab.tsx
import React, { useState, useEffect } from 'react';
import { ArrowDownUp, ChevronDown, Settings, Info, TrendingUp, RotateCcw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext';
import { useLivePrices } from '../hooks/usePrices';

const TOKEN_LIST = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '◆' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441E8C7A0f7F4B2B5f1B2E4c8D5E6F', decimals: 6, logo: '$' },
  { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, logo: '₮' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, logo: '◈' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, logo: '₿' },
  { symbol: 'stETH', name: 'Lido Staked ETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', decimals: 18, logo: '⬡' },
  { symbol: 'wstETH', name: 'Wrapped stETH', address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', decimals: 18, logo: '⬢' },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, logo: '🦄' },
];

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
}

export function SwapTab() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { data: prices } = useLivePrices();

  const [fromToken, setFromToken] = useState<Token>(TOKEN_LIST[0]);
  const [toToken, setToToken] = useState<Token>(TOKEN_LIST[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showTokenSelect, setShowTokenSelect] = useState<'from' | 'to' | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [route, setRoute] = useState<string[]>([]);

  // Calculate estimated output based on mock price data
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToAmount('');
      setPriceImpact(0);
      return;
    }

    const fromPrice = getTokenPrice(fromToken.symbol);
    const toPrice = getTokenPrice(toToken.symbol);

    if (fromPrice && toPrice) {
      const inputValue = parseFloat(fromAmount) * fromPrice;
      const outputAmount = inputValue / toPrice;
      // Apply 0.3% fee
      const fee = outputAmount * 0.003;
      const finalAmount = outputAmount - fee;
      setToAmount(finalAmount.toFixed(6));

      // Mock price impact
      const impact = Math.min(parseFloat(fromAmount) * 0.001 * 100, 15);
      setPriceImpact(impact);

      // Mock route
      if (fromToken.symbol === 'ETH' && toToken.symbol === 'USDC') {
        setRoute(['ETH → WETH → USDC']);
      } else if (fromToken.symbol === 'stETH' && toToken.symbol === 'ETH') {
        setRoute(['stETH → ETH']);
      } else {
        setRoute([`${fromToken.symbol} → WETH → ${toToken.symbol}`]);
      }
    }
  }, [fromAmount, fromToken, toToken]);

  const getTokenPrice = (symbol: string): number => {
    const priceMap: Record<string, number> = {
      'ETH': prices?.ethereum?.usd || 3500,
      'stETH': prices?.ethereum?.usd || 3500,
      'wstETH': prices?.ethereum?.usd || 3500,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': prices?.bitcoin?.usd || 65000,
      'UNI': prices?.uniswap?.usd || 8,
    };
    return priceMap[symbol] || 1;
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMax = () => {
    setFromAmount('10.5'); // Mock balance
  };

  const handleSwap = async () => {
    if (!isConnected) {
      showToast({ type: 'error', title: 'Wallet Not Connected', message: 'Please connect your wallet to swap.' });
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      showToast({ type: 'error', title: 'Invalid Amount', message: 'Please enter an amount to swap.' });
      return;
    }

    setIsSwapping(true);
    try {
      // Simulate swap delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast({
        type: 'success',
        title: 'Swap Executed',
        message: `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
      });
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      showToast({ type: 'error', title: 'Swap Failed', message: 'Transaction was rejected or failed.' });
    } finally {
      setIsSwapping(false);
    }
  };

  const TokenSelectModal = ({ onSelect, onClose }: { onSelect: (t: Token) => void; onClose: () => void }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border-main rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-main flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-main">Select Token</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-main">✕</button>
        </div>
        <div className="p-2 overflow-y-auto max-h-[60vh]">
          {TOKEN_LIST.map(token => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token); onClose(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-input transition-colors text-left"
            >
              <span className="w-10 h-10 rounded-full bg-[#00A3FF]/10 flex items-center justify-center text-lg font-bold text-[#00A3FF]">
                {token.logo}
              </span>
              <div>
                <p className="font-bold text-text-main">{token.symbol}</p>
                <p className="text-xs text-text-secondary">{token.name}</p>
              </div>
              <span className="ml-auto text-sm text-text-secondary">
                ${getTokenPrice(token.symbol).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Swap</h1>
            <p className="text-sm text-text-secondary mt-1">Exchange tokens instantly</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl border border-border-main bg-input hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-card border border-border-main rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-main mb-3">Transaction Settings</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Slippage Tolerance</span>
                  <div className="flex items-center gap-2">
                    {['0.1', '0.5', '1.0'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSlippage(parseFloat(s))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          slippage === parseFloat(s)
                            ? 'bg-[#00A3FF] text-white'
                            : 'bg-input text-text-secondary hover:text-text-main'
                        }`}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Card */}
        <div className="bg-card border border-border-main rounded-2xl p-4 shadow-sm">
          {/* From Token */}
          <div className="bg-input rounded-xl p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">From</span>
              <span className="text-xs text-text-secondary">Balance: 10.5 {fromToken.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                className="flex-1 bg-transparent text-3xl font-bold text-text-main outline-none placeholder:text-text-secondary/30"
              />
              <button
                onClick={() => setShowTokenSelect('from')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border-main hover:border-[#00A3FF]/50 transition-colors"
              >
                <span className="text-lg">{fromToken.logo}</span>
                <span className="font-bold text-text-main">{fromToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-secondary">
                ${fromAmount ? (parseFloat(fromAmount) * getTokenPrice(fromToken.symbol)).toFixed(2) : '0.00'}
              </span>
              <button onClick={handleMax} className="text-xs font-bold text-[#00A3FF] hover:underline">
                MAX
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="p-2 rounded-xl bg-card border-2 border-border-main hover:border-[#00A3FF] hover:bg-[#00A3FF]/10 transition-all shadow-lg"
            >
              <ArrowDownUp className="w-5 h-5 text-[#00A3FF]" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-input rounded-xl p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">To</span>
              <span className="text-xs text-text-secondary">Balance: 2,450 {toToken.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="flex-1 bg-transparent text-3xl font-bold text-text-main outline-none placeholder:text-text-secondary/30"
              />
              <button
                onClick={() => setShowTokenSelect('to')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border-main hover:border-[#00A3FF]/50 transition-colors"
              >
                <span className="text-lg">{toToken.logo}</span>
                <span className="font-bold text-text-main">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-text-secondary">
                ${toAmount ? (parseFloat(toAmount) * getTokenPrice(toToken.symbol)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Price Info */}
          {fromAmount && parseFloat(fromAmount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Rate
                </span>
                <span className="text-text-main font-medium">
                  1 {fromToken.symbol} = {(getTokenPrice(fromToken.symbol) / getTokenPrice(toToken.symbol)).toFixed(6)} {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Price Impact</span>
                <span className={`font-medium ${priceImpact > 5 ? 'text-red-500' : priceImpact > 1 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Liquidity Provider Fee</span>
                <span className="text-text-main font-medium">0.3%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Route</span>
                <span className="text-text-main font-medium text-xs">{route[0]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Slippage</span>
                <span className="text-text-main font-medium">{slippage}%</span>
              </div>
            </motion.div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
            className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all ${
              isSwapping || !fromAmount || parseFloat(fromAmount) <= 0
                ? 'bg-text-secondary/30 cursor-not-allowed'
                : 'bg-[#00A3FF] hover:bg-[#0090E6] active:scale-[0.98] shadow-lg shadow-[#00A3FF]/20'
            }`}
          >
            {isSwapping ? (
              <span className="flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5 animate-spin" /> Swapping...
              </span>
            ) : !isConnected ? (
              'Connect Wallet'
            ) : (
              `Swap ${fromToken.symbol} for ${toToken.symbol}`
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 flex items-start gap-2 text-xs text-text-secondary">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Swaps are simulated for demonstration. Connect your wallet to execute real transactions on the blockchain.
            Always verify token contracts before swapping.
          </p>
        </div>
      </motion.div>

      {/* Token Select Modal */}
      <AnimatePresence>
        {showTokenSelect && (
          <TokenSelectModal
            onSelect={token => {
              if (showTokenSelect === 'from') setFromToken(token);
              else setToToken(token);
            }}
            onClose={() => setShowTokenSelect(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
