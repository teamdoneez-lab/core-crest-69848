import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Star, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    sku: string;
    part_name: string;
    description?: string;
    images?: string[];
  };
  onSuccess: () => void;
}

interface ImageUpload {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  url?: string;
}

export function ProductEditModal({ open, onOpenChange, product, onSuccess }: ProductEditModalProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [existingImages, setExistingImages] = useState<string[]>(product.images || []);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return "Only JPG, PNG, and WEBP images are allowed";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image size must be less than 5MB";
    }
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList) => {
      const totalImages = existingImages.length + imageUploads.length;
      const filesArray = Array.from(files);

      if (totalImages + filesArray.length > 5) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 5 images per product",
          variant: "destructive",
        });
        return;
      }

      const newUploads: ImageUpload[] = [];

      for (const file of filesArray) {
        const error = validateFile(file);
        if (error) {
          toast({
            title: "Invalid file",
            description: `${file.name}: ${error}`,
            variant: "destructive",
          });
          continue;
        }

        newUploads.push({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          uploaded: false,
        });
      }

      setImageUploads((prev) => [...prev, ...newUploads]);
    },
    [imageUploads.length, existingImages.length],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const removeImageUpload = (index: number) => {
    setImageUploads((prev) => {
      const newUploads = [...prev];
      URL.revokeObjectURL(newUploads[index].preview);
      newUploads.splice(index, 1);
      return newUploads;
    });
  };

  const handleDeleteImageClick = (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("delete-product-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: product.sku,
          imageUrl: imageToDelete,
        }),
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Unknown delete error");
      }

      setExistingImages((prev) => prev.filter((url) => url !== imageToDelete));

      toast({
        title: "Image deleted",
        description: "The image has been removed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setImageToDelete(null);
    }
  };

  const uploadImage = async (upload: ImageUpload, index: number): Promise<string> => {
    const fileExt = upload.file.name.split(".").pop();
    const fileName = `${product.sku}-${Date.now()}-${index}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, upload.file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      // Upload all new images
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageUploads.length; i++) {
        const upload = imageUploads[i];
        if (!upload.uploaded) {
          setImageUploads((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], progress: 50 };
            return updated;
          });

          const url = await uploadImage(upload, i);
          uploadedUrls.push(url);

          setImageUploads((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], progress: 100, uploaded: true, url };
            return updated;
          });
        }
      }

      // Combine existing and new images, with primary image first
      let allImages = [...existingImages, ...uploadedUrls];

      // Reorder to put primary image first
      if (primaryImageIndex > 0 && primaryImageIndex < allImages.length) {
        const primary = allImages[primaryImageIndex];
        allImages = [primary, ...allImages.filter((_, i) => i !== primaryImageIndex)];
      }

      // Update product in database
      const { error: updateError } = await supabase
        .from("supplier_products")
        .update({ images: allImages } as any)
        .eq("id", product.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Product images updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const totalImages = existingImages.length + imageUploads.length;
  const canAddMore = totalImages < 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product Images</DialogTitle>
          <DialogDescription>
            {product.sku} - {product.part_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Current Images</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {existingImages.map((url, index) => (
                  <div key={url} className="relative group">
                    <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
                      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteImageClick(url)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={primaryImageIndex === index ? "default" : "secondary"}
                      className="absolute bottom-2 right-2 h-7 w-7"
                      onClick={() => setPrimaryImageIndex(index)}
                      title="Set as primary image"
                    >
                      <Star className={cn("h-4 w-4", primaryImageIndex === index && "fill-current")} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Uploads */}
          {imageUploads.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">New Images</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imageUploads.map((upload, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
                      <img src={upload.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      {upload.progress > 0 && upload.progress < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Progress value={upload.progress} className="w-3/4" />
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImageUpload(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          {canAddMore && (
            <div
              onDrop={handleDrop}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                !canAddMore && "opacity-50 cursor-not-allowed",
              )}
            >
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-2">Drag and drop images here, or click to browse</p>
              <p className="text-xs text-muted-foreground mb-4">
                JPG, PNG, or WEBP • Max 5MB per image • {5 - totalImages} remaining
              </p>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={!canAddMore || uploading}
              />
              <Label htmlFor="image-upload">
                <Button variant="outline" asChild disabled={!canAddMore || uploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Browse Files
                  </span>
                </Button>
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploading || (imageUploads.length === 0 && existingImages.length === product.images?.length)}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this image? This action cannot be undone and will permanently delete the
              image from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Image"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
