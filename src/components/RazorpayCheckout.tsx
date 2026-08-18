'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { api, getAuthUser } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  keyId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  itemName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RazorpayCheckout({
  keyId,
  orderId,
  razorpayOrderId,
  amount,
  itemName,
  onSuccess,
  onCancel,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const openCheckout = async () => {
      try {
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'));
            document.body.appendChild(script);
          });
        }
        if (cancelled) return;

        const user = getAuthUser();
        const rzp = new window.Razorpay({
          key: keyId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: 'ExamOS',
          description: itemName,
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          handler: async (response: any) => {
            try {
              await api.post('/orders/verify', {
                orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                mode: 'razorpay',
              });
              if (!cancelled) onSuccess();
            } catch (err: any) {
              if (!cancelled) {
                setError(err.message || 'Payment verification failed. Please contact support.');
                setLoading(false);
              }
            }
          },
          modal: {
            ondismiss: () => {
              if (!cancelled) onCancel();
            },
            escape: true,
          },
          theme: { color: '#10b981' },
        });
        rzp.on('payment.failed', (resp: any) => {
          setError(resp?.error?.description || 'Payment failed. Please try again.');
          setLoading(false);
        });
        if (!cancelled) {
          rzp.open();
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Could not open payment window.');
          setLoading(false);
        }
      }
    };

    openCheckout();

    return () => {
      cancelled = true;
    };
  }, [keyId, orderId, razorpayOrderId, amount, itemName, onSuccess, onCancel]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card w-full max-w-md p-8 rounded-3xl border border-border shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold font-outfit">Secure Payment</h3>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          Paying <span className="font-bold text-foreground">₹{amount}</span> for {itemName}
        </p>

        {loading && !error && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Opening Razorpay checkout...
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline self-center mt-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}