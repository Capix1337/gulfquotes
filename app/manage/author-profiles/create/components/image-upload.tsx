"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImagePlus, X } from "lucide-react";
import { cloudinaryConfig, getMaxFiles, getFolder } from "@/lib/cloudinary";
import { CldImage } from "next-cloudinary";
import { UseFormReturn } from "react-hook-form";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { CreateAuthorProfileInput } from "@/schemas/author-profile";

interface CreateImageUploadProps {
  form: UseFormReturn<CreateAuthorProfileInput>;
  disabled?: boolean;
}

export function CreateImageUpload({ form, disabled }: CreateImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const currentImages = form.watch("images") || [];

  const handleUploadSuccess = (result: CloudinaryUploadResult) => {
    if (result.event !== "success" || !result.info) return;

    const currentImages = form.getValues("images") || [];
    if (currentImages.length >= getMaxFiles('authors')) {
      return;
    }

    const info = result.info as CloudinaryUploadWidgetInfo;
    const newImage = {
      url: info.secure_url,
      id: info.public_id,
    };

    form.setValue("images", [...currentImages, newImage], {
      shouldValidate: true,
    });
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue("images", newImages, { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Author Images</div>
      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            <FormLabel>Images</FormLabel>
            <div className="space-y-4">
              {currentImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentImages.map((image, index) => (
                    <div key={image.id || index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        <CldImage
                          src={image.url}
                          width={300}
                          height={300}
                          alt="Author profile image"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {currentImages.length < getMaxFiles('authors') && (
                <CldUploadWidget
                  uploadPreset={cloudinaryConfig.uploadPreset}
                  options={{
                    maxFiles: getMaxFiles('authors') - currentImages.length,
                    folder: getFolder('authors'),
                    clientAllowedFormats: [...cloudinaryConfig.limits.authors.allowedFormats],
                    maxFileSize: cloudinaryConfig.limits.maxFileSize,
                  }}
                  onSuccess={handleUploadSuccess}
                  onOpen={() => setUploading(true)}
                  onClose={() => setUploading(false)}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => open()}
                      disabled={disabled || uploading}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </CldUploadWidget>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}