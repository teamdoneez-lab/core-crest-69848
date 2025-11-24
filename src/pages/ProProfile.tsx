// -----------------------------------------------------
// CLEAN GEO-CODE CALL (FINAL VERSION)
// -----------------------------------------------------
const geocodeAddress = async ({ pro_id, zip_code, address }: { pro_id: string; zip_code: string; address: string }) => {
  try {
    const res = await fetch("/functions/v1/geocode_pro_profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pro_id, zip_code, address }),
    });

    if (!res.ok) {
      console.error("Geocode error:", await res.text());
    }
  } catch (err) {
    console.error("Failed calling geocode function:", err);
  }
};

import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Building2, MapPin, CheckCircle, XCircle, Save, Edit, Search } from "lucide-react";
import { accordionsData } from "@/data/serviceslist-detailed";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// -----------------------------------------------------
// SCHEMA
// -----------------------------------------------------
const proProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  business_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(10).max(15).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  website: z.string().trim().url().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  zip_code: z.string().trim().min(5).max(10).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  service_radius: z.number().min(5).max(100),
  selectedServices: z.array(z.string()).min(1),
  service_areas: z.string().trim().min(1),
});

interface ProProfile {
  business_name: string;
  phone?: string;
  address?: string;
  website?: string;
  description?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  service_radius: number;
  is_verified: boolean;
  profile_complete: boolean;
}

// -----------------------------------------------------
// COMPONENT
// -----------------------------------------------------
export default function ProProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    zip_code: "",
    city: "",
    state: "",
    service_radius: 25,
    selectedServices: [] as string[],
    service_areas: "",
  });

  // -----------------------------------------------------
  // LOAD PROFILE
  // -----------------------------------------------------
  useEffect(() => {
    if (user) {
      Promise.all([fetchProProfile(), fetchProServiceAreas()]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchProProfile = async () => {
    const { data: proData } = await supabase.from("pro_profiles").select("*").eq("pro_id", user?.id).single();

    const { data: profileData } = await supabase.from("profiles").select("name").eq("id", user?.id).single();

    if (proData) {
      setProfile(proData);

      let selectedServices: string[] = [];
      if (proData.notes) {
        try {
          selectedServices = JSON.parse(proData.notes).selectedServices || [];
        } catch {}
      }

      setFormData((prev) => ({
        ...prev,
        name: profileData?.name || "",
        business_name: proData.business_name,
        phone: proData.phone || "",
        address: proData.address || "",
        website: proData.website || "",
        description: proData.description || "",
        zip_code: proData.zip_code || "",
        city: proData.city || "",
        state: proData.state || "",
        service_radius: proData.service_radius || 25,
        selectedServices,
      }));
    }
  };

  const fetchProServiceAreas = async () => {
    const { data } = await supabase.from("pro_service_areas").select("zip").eq("pro_id", user?.id);

    if (data) {
      setFormData((prev) => ({
        ...prev,
        service_areas: data.map((x) => x.zip).join(", "),
      }));
    }
  };

  // -----------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------
  const handleSelectService = (id: string, checked: boolean) => {
  setFormData((prev) => ({
    ...prev,
    selectedServices: checked
      ? [...prev.selectedServices, id]
      : prev.selectedServices.filter((x) => x !== id),
  }));
};


  const handleSelectSubCategory = (sub: any, checked: boolean) => {
  const ids = sub.services.map((s: any) => s.id);

  setFormData((prev) => ({
    ...prev,
    selectedServices: checked
      ? Array.from(new Set([...prev.selectedServices, ...ids]))
      : prev.selectedServices.filter((id) => !ids.includes(id)),
  }));
};


  const handleSelectAllInAccordion = (accordion: any, checked: boolean) => {
    const ids = accordion.subItems.flatMap((sub: any) => sub.services.map((s: any) => s.id));

    setFormData((prev) => ({
      ...prev,
      selectedServices: checked
        ? [...new Set([...prev.selectedServices, ...ids])]
        : prev.selectedServices.filter((id) => !ids.includes(id)),
    }));
  };

  // -----------------------------------------------------
  // SUBMIT
  // -----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = proProfileSchema.parse({
        ...formData,
        service_areas: formData.service_areas.trim(),
      });

      const zipCodes = validatedData.service_areas
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);

      // Save name
      const { error: nameErr } = await supabase
        .from("profiles")
        .update({ name: validatedData.name })
        .eq("id", user?.id);

      if (nameErr) throw nameErr;

      // Save profile
      const { error: profileErr } = await supabase.from("pro_profiles").upsert({
        pro_id: user?.id,
        business_name: validatedData.business_name,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        website: validatedData.website || null,
        description: validatedData.description || null,
        zip_code: validatedData.zip_code || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        service_radius: validatedData.service_radius,
      });

      if (profileErr) throw profileErr;

      // ---------------------------
      // CALL GEOCODE IF ZIP OR ADDRESS CHANGED
      // ---------------------------
      const zipChanged = validatedData.zip_code !== profile?.zip_code;
      const addressChanged = validatedData.address !== profile?.address;

      if (zipChanged || addressChanged) {
        await geocodeAddress({
          pro_id: user!.id,
          zip_code: validatedData.zip_code || "",
          address: validatedData.address || "",
        });
      }

      // Store selected services
      await supabase
        .from("pro_profiles")
        .update({
          notes: JSON.stringify({
            selectedServices: validatedData.selectedServices,
          }),
        })
        .eq("pro_id", user?.id);

      // Reset service areas
      await supabase.from("pro_service_areas").delete().eq("pro_id", user?.id);

      if (zipCodes.length > 0) {
        const inserts = zipCodes.map((zip) => ({
          pro_id: user?.id,
          zip,
        }));
        await supabase.from("pro_service_areas").insert(inserts);
      }

      toast({
        title: "Success!",
        description: "Your profile has been saved.",
      });

      setIsEditing(false);
      await fetchProProfile();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving profile",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["pro"]}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-4xl p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Professional Profile</h1>
              <p className="text-muted-foreground">Manage your business information and settings</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                {profile?.is_verified ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" /> Pending Verification
                  </>
                )}
              </Badge>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NAME + BUSINESS NAME + PHONE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  {isEditing ? (
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.name || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Business Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.business_name || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{formData.phone || "Not provided"}</p>
                  )}
                </div>
              </div>

              {/* ADDRESS */}
              <div className="space-y-2">
                <Label>Address</Label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.address || "Not provided"}</p>
                )}
              </div>

              {/* WEBSITE */}
              <div className="space-y-2">
                <Label>Website</Label>
                {isEditing ? (
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {formData.website ? (
                      <a href={formData.website} target="_blank" className="text-primary underline">
                        {formData.website}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description}
                    rows={4}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.description || "Not provided"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LOCATION */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Service Area
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* LOCATION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  {isEditing ? (
                    <Input
                      value={formData.zip_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zip_code: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{formData.zip_code || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  {isEditing ? (
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          city: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{formData.city || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  {isEditing ? (
                    <Input
                      value={formData.state}
                      maxLength={2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          state: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  ) : (
                    <p>{formData.state || "Not provided"}</p>
                  )}
                </div>
              </div>

              {/* SERVICE RADIUS */}
              <div className="space-y-2">
                <Label>Service Radius (miles)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={formData.service_radius}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_radius: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  <p>{formData.service_radius} miles</p>
                )}
              </div>

              {/* ADDITIONAL ZIP CODES */}
              <div className="space-y-2">
                <Label>Additional ZIP Codes</Label>
                {isEditing ? (
                  <Input
                    value={formData.service_areas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_areas: e.target.value,
                      })
                    }
                    placeholder="12345, 12346, 12347"
                  />
                ) : (
                  <p>{formData.service_areas || "Not provided"}</p>
                )}
                <p className="text-xs text-muted-foreground">Enter multiple ZIP codes separated by commas</p>
              </div>
            </CardContent>
          </Card>

          {/* SERVICES */}
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select the services you provide</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {/* SEARCH */}
<div className="space-y-2">
  <Label>Search Services</Label>
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      className="pl-10"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>

{/* FILTERED ACCORDIONS */}
{(() => {
  const normalizedSearch = searchTerm.toLowerCase().trim();

  const filteredAccordions = accordionsData
    .map((accordion) => {
      const filteredSub = accordion.subItems
        .map((sub) => {
          const filteredServices = sub.services.filter((service) =>
            service.name.toLowerCase().includes(normalizedSearch)
          );
          return { ...sub, services: filteredServices };
        })
        .filter((sub) => sub.services.length > 0);

      return { ...accordion, subItems: filteredSub };
    })
    .filter((acc) => acc.subItems.length > 0);

  return (
    <div className="border rounded-lg max-h-96 overflow-y-auto">
      <Accordion type="multiple">
        {filteredAccordions.map((acc) => {
          const accServiceIds = acc.subItems.flatMap((sub) =>
            sub.services.map((svc) => svc.id)
          );

          const allSelected =
            accServiceIds.length > 0 &&
            accServiceIds.every((id) =>
              formData.selectedServices.includes(id)
            );

          const someSelected = accServiceIds.some((id) =>
            formData.selectedServices.includes(id)
          );

          return (
            <AccordionItem key={acc.title} value={acc.title}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        const input = el.querySelector("input");
                        if (input)
                          input.indeterminate =
                            someSelected && !allSelected;
                      }
                    }}
                    onCheckedChange={(checked) =>
                      handleSelectAllInAccordion(acc, checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  {acc.title}
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="px-4 pb-2 space-y-3">
                  {acc.subItems.map((sub) => {
                    const subIds = sub.services.map((svc) => svc.id);

                    const subAllSelected =
                      subIds.length > 0 &&
                      subIds.every((id) =>
                        formData.selectedServices.includes(id)
                      );

                    const subSomeSelected = subIds.some((id) =>
                      formData.selectedServices.includes(id)
                    );

                    return (
                      <div key={sub.title} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={subAllSelected}
                            ref={(el) => {
                              if (el) {
                                const input = el.querySelector("input");
                                if (input)
                                  input.indeterminate =
                                    subSomeSelected &&
                                    !subAllSelected;
                              }
                            }}
                            onCheckedChange={(checked) =>
                              handleSelectSubCategory(
                                sub,
                                checked as boolean
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">{sub.title}</span>
                        </div>

                        <div className="pl-6 space-y-1">
                          {sub.services.map((svc) => (
                            <div
                              key={svc.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={formData.selectedServices.includes(
                                  svc.id
                                )}
                                onCheckedChange={(checked) =>
                                  handleSelectService(
                                    svc.id,
                                    checked as boolean
                                  )
                                }
                              />
                              {svc.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
})()}
