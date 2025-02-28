
import { AuthContainer } from "@/components/auth/AuthContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { UserRound, LogIn, Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  // Parse return URL from query parameters
  const params = new URLSearchParams(location.search);
  const returnUrl = params.get('returnUrl');

  useEffect(() => {
    if (session) {
      // If there's a return URL, navigate back to it after login
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/");
      }
    }
  }, [session, navigate, returnUrl]);

  // If user is trying to access a vehicle page, show a different message
  const isVehicleAccess = returnUrl?.startsWith('/vehicles/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 p-4 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(225deg,_#FFE29F_0%,_#FFA99F_48%,_#FF719A_100%)] opacity-30"></div>
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-48 h-48 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Main content */}
      <div className="w-full max-w-md space-y-8 z-10 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 shadow-md mb-6 transform hover:scale-105 transition-transform duration-300">
            <Building2 className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            {isVehicleAccess ? 'Vehicle Information Access' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isVehicleAccess 
              ? 'Please sign in to view vehicle details and report issues'
              : 'Choose how you want to access the system'}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-xl hover:shadow-2xl transition-all duration-300 ring-1 ring-gray-100">
          <div className="space-y-6">
            <Button 
              variant="default" 
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex items-center justify-between gap-2 h-16 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => navigate("/customer-portal")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-400/50 rounded-lg">
                  <UserRound className="w-5 h-5" />
                </div>
                <span className="font-medium">Customer Portal</span>
              </div>
              <div className="bg-orange-400/30 p-2 rounded-lg transform group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <LogIn className="w-5 h-5 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Staff & Admin Access</p>
              </div>
              <div className="transition-all duration-300 hover:translate-y-[-2px]">
                <AuthContainer />
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our <a href="#" className="text-orange-600 hover:text-orange-700 transition-colors underline">Terms of Service</a> and <a href="#" className="text-orange-600 hover:text-orange-700 transition-colors underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
