
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCustomerPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [activeAgreementId, setActiveAgreementId] = useState<string | null>(null);

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const portalSession = localStorage.getItem("customerPortalSession");
    if (portalSession) {
      try {
        const sessionData = JSON.parse(portalSession);
        if (sessionData && sessionData.agreementId) {
          setActiveAgreementId(sessionData.agreementId);
          setCustomerId(sessionData.customerId || "");
          setCustomerName(sessionData.customerName || "");
          setCustomerEmail(sessionData.customerEmail || "");
          setCustomerPhone(sessionData.customerPhone || "");
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error parsing stored session:", error);
        localStorage.removeItem("customerPortalSession");
      }
    }
  }, []);

  const handleLogin = async (agrNumber: string, phoneNumber: string) => {
    setIsLoading(true);

    try {
      // Get agreement by agreement number
      const { data: agreementData, error: agreementError } = await supabase
        .from("leases")
        .select(`
          id,
          agreement_number,
          customer_id,
          customer:profiles!leases_customer_id_fkey (
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq("agreement_number", agrNumber)
        .single();

      if (agreementError || !agreementData) {
        console.error("Agreement fetch error:", agreementError);
        toast.error("Agreement not found. Please check your agreement number.");
        setIsLoading(false);
        return false;
      }

      // Verify phone number matches
      const customer = agreementData.customer;
      if (!customer || !customer.phone_number || customer.phone_number !== phoneNumber) {
        toast.error("Phone number does not match our records.");
        setIsLoading(false);
        return false;
      }

      // Login successful
      toast.success("Login successful!");
      
      // Save session info
      const sessionData = {
        agreementId: agreementData.id,
        customerId: agreementData.customer_id,
        customerName: customer.full_name,
        customerEmail: customer.email,
        customerPhone: customer.phone_number
      };
      
      // Save to state
      setActiveAgreementId(agreementData.id);
      setCustomerId(agreementData.customer_id);
      setCustomerName(customer.full_name || null);
      setCustomerEmail(customer.email || null);
      setCustomerPhone(customer.phone_number || null);
      
      // Save to localStorage
      localStorage.setItem("customerPortalSession", JSON.stringify(sessionData));
      setIsLoggedIn(true);
      return true;
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveAgreementId(null);
    setCustomerId(null);
    setCustomerName(null);
    setCustomerEmail(null);
    setCustomerPhone(null);
    localStorage.removeItem("customerPortalSession");
    toast.info("You have been logged out.");
  };

  return {
    isLoggedIn,
    isLoading,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    activeAgreementId,
    handleLogin,
    handleLogout
  };
};
