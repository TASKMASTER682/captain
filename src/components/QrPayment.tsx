'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, XCircle, Clock, Copy, Check, Smartphone, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface QrPaymentProps {
  orderId: string;
  razorpayOrderId: string;
  upiString: string;
  merchantVpa: string;
  amount: number;
  itemName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentMode = 'qr' | 'upi-app' | 'upi-id';

export default function QrPayment({
  orderId,
  razorpayOrderId,
  upiString,
  merchantVpa,
  amount,
  itemName,
  onSuccess,
  onCancel,
}: QrPaymentProps) {
  const [status, setStatus] = useState<'pending' | 'polling' | 'paid' | 'failed'>('pending');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<PaymentMode>('qr');
  const [upiInput, setUpiInput] = useState('');
  const [upiError, setUpiError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}/status`);
      if (!mountedRef.current) return;
      if (res.data.status === 'paid') {
        setStatus('paid');
        if (pollingRef.current) clearInterval(pollingRef.current);
        setTimeout(() => onSuccess(), 1500);
      }
    } catch {
      // ignore polling errors
    }
  }, [orderId, onSuccess]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setStatus('polling');
    checkStatus();
    pollingRef.current = setInterval(checkStatus, 4000);
  }, [checkStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const copyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openUpiApp = () => {
    window.location.href = upiString;
    startPolling();
  };

  const handleUpiIdPay = () => {
    const vpa = upiInput.trim();
    if (!vpa || !vpa.includes('@')) {
      setUpiError('Enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setUpiError('');
    const customUpi = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantVpa)}&am=${amount}&cu=INR&tn=${encodeURIComponent(itemName)}&tr=${encodeURIComponent(razorpayOrderId)}`;
    window.location.href = customUpi;
    startPolling();
  };

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h3 className="text-xl font-semibold text-green-600">Payment Successful!</h3>
        <p className="text-muted-foreground text-sm">Access is being unlocked...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-muted-foreground text-center">
        Pay <span className="font-bold text-foreground">₹{amount}</span> for {itemName}
      </p>

      {/* Mode Tabs */}
      <div className="flex w-full rounded-xl border border-border overflow-hidden text-sm font-medium">
        <button
          onClick={() => setMode('qr')}
          className={`flex-1 py-2.5 transition-colors ${mode === 'qr' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          Scan QR
        </button>
        <button
          onClick={() => setMode('upi-app')}
          className={`flex-1 py-2.5 transition-colors ${mode === 'upi-app' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Pay via UPI App
          </span>
        </button>
        <button
          onClick={() => setMode('upi-id')}
          className={`flex-1 py-2.5 transition-colors ${mode === 'upi-id' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          Enter UPI ID
        </button>
      </div>

      {/* QR Mode */}
      {mode === 'qr' && (
        <>
          <p className="text-xs text-muted-foreground">Scan with any UPI app (GPay, PhonePe, Paytm etc.)</p>
          <div className="bg-white p-4 rounded-xl shadow-lg border">
            <QRCodeSVG value={upiString} size={200} level="H" includeMargin={false} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>UPI ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{merchantVpa}</code>
            <button onClick={copyVpa} className="p-1 hover:bg-muted rounded transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </>
      )}

      {/* UPI App Mode */}
      {mode === 'upi-app' && (
        <>
          <p className="text-xs text-muted-foreground">Click below to open your UPI app directly</p>
          <button
            onClick={openUpiApp}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            <Smartphone className="w-4 h-4" /> Open UPI App & Pay ₹{amount}
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-muted-foreground text-center">Redirects to your default UPI app</p>
        </>
      )}

      {/* UPI ID Mode */}
      {mode === 'upi-id' && (
        <>
          <p className="text-xs text-muted-foreground">Enter your UPI ID to pay</p>
          <div className="flex w-full gap-2">
            <input
              type="text"
              value={upiInput}
              onChange={(e) => { setUpiInput(e.target.value); setUpiError(''); }}
              placeholder="yourname@bank"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono"
            />
            <button
              onClick={handleUpiIdPay}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Pay ₹{amount}
            </button>
          </div>
          {upiError && <p className="text-[11px] text-rose-500 font-semibold">{upiError}</p>}
          <p className="text-[10px] text-muted-foreground text-center">You&apos;ll be redirected to your UPI app to complete payment</p>
        </>
      )}

      {/* Status */}
      {status === 'pending' && (
        <button
          onClick={startPolling}
          className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
        >
          I&apos;ve Completed Payment
        </button>
      )}

      {status === 'polling' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for payment confirmation...</span>
          <Clock className="w-3 h-3" />
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
          <XCircle className="w-4 h-4" />
          <span>Payment not detected. Try again.</span>
        </div>
      )}

      <button
        onClick={onCancel}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline mt-1"
      >
        Cancel
      </button>
    </div>
  );
}
