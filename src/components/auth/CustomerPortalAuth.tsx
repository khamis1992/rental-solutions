import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export const CustomerPortalAuth = () => {
  const navigate = useNavigate();
  const [agreementNumber, setAgreementNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First verify the agreement number and phone number match
      const { data: customer, error: customerError } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          customer:customer_id (
            id,
            phone_number
          )
        `)
        .eq('agreement_number', agreementNumber)
        .single();

      if (customerError || !customer) {
        toast.error('Invalid agreement number');
        return;
      }

      if (customer.customer?.phone_number !== phoneNumber) {
        toast.error('Phone number does not match agreement');
        return;
      }

      // Create a magic link session
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (authError) {
        toast.error('Error sending verification code');
        return;
      }

      toast.success('Verification code sent to your phone');
      navigate('/verify', { 
        state: { 
          phoneNumber,
          agreementNumber 
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md p-4">
        <Card className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Customer Portal</h1>
            <p className="text-gray-600">Please sign in to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Agreement Number"
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <Input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};