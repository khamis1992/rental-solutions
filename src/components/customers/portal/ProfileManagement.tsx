import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export const ProfileManagement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
    nationality: ""
  });

  // Fetch profile data
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["customer-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      // Update form data with fetched profile
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          email: data.email || "",
          address: data.address || "",
          nationality: data.nationality || ""
        });
      }

      return data;
    },
    enabled: !!userId,
    retry: 1
  });

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("No user ID found");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Information</CardTitle>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            {isEditing ? (
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            ) : (
              <p className="mt-1">{profile?.full_name || "Not provided"}</p>
            )}
          </div>

          <div>
            <Label>Phone Number</Label>
            {isEditing ? (
              <Input
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
            ) : (
              <p className="mt-1">{profile?.phone_number || "Not provided"}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            ) : (
              <p className="mt-1">{profile?.email || "Not provided"}</p>
            )}
          </div>

          <div>
            <Label>Nationality</Label>
            {isEditing ? (
              <Input
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
              />
            ) : (
              <p className="mt-1">{profile?.nationality || "Not provided"}</p>
            )}
          </div>

          <div>
            <Label>Address</Label>
            {isEditing ? (
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            ) : (
              <p className="mt-1">{profile?.address || "Not provided"}</p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to current profile values
                  if (profile) {
                    setFormData({
                      full_name: profile.full_name || "",
                      phone_number: profile.phone_number || "",
                      email: profile.email || "",
                      address: profile.address || "",
                      nationality: profile.nationality || ""
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};